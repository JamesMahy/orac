import { createHash } from 'crypto';
import { dirname } from 'path';
import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'ssh2';
import { PrismaService } from '@database/prisma.service';
import { EncryptionService } from '@common/crypto/encryption.service';
import { shellEscape } from '../helpers';
import type { TestConnectionDto } from './ssh.dto';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

type ConnectionEntry = {
  client: Client;
  status: ConnectionStatus;
  message?: string;
  reconnectAttempts: number;
  reconnectTimer?: ReturnType<typeof setTimeout>;
  lastUsedAt: number;
};

type ExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

type DirectoryEntry = {
  name: string;
  type: 'directory' | 'file';
  size: number;
};

type BrowseResult = {
  path: string;
  parentPath: string | null;
  entries: DirectoryEntry[];
};

type ConnectionConfig = {
  hostname: string;
  port: number;
  username: string;
  password?: string;
  storedFingerprint?: string;
};

type ConnectionStatusResult = {
  status: ConnectionStatus;
  message?: string;
};

type TestConnectionResult = {
  success: boolean;
  message?: string;
  fingerprint?: string;
};

@Injectable()
export class SshService implements OnModuleDestroy {
  private readonly logger = new Logger(SshService.name);
  private readonly connections = new Map<string, ConnectionEntry>();

  private readonly keepaliveInterval: number;
  private readonly keepaliveCountMax: number;
  private readonly reconnectBaseMs: number;
  private readonly reconnectMaxAttempts: number;
  private readonly testTimeoutMs: number;
  private readonly execTimeoutMs: number;
  private readonly execMaxOutputBytes: number;
  private readonly maxConcurrentConnections: number;
  private readonly connectionIdleTimeoutMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly config: ConfigService,
  ) {
    this.keepaliveInterval = this.config.get<number>(
      'SSH_KEEPALIVE_INTERVAL',
      60_000,
    );
    this.keepaliveCountMax = this.config.get<number>(
      'SSH_KEEPALIVE_COUNT_MAX',
      3,
    );
    this.reconnectBaseMs = this.config.get<number>(
      'SSH_RECONNECT_BASE_MS',
      2_000,
    );
    this.reconnectMaxAttempts = this.config.get<number>(
      'SSH_RECONNECT_MAX_ATTEMPTS',
      3,
    );
    this.testTimeoutMs = this.config.get<number>('SSH_TEST_TIMEOUT_MS', 10_000);
    this.execTimeoutMs = this.config.get<number>('SSH_EXEC_TIMEOUT_MS', 30_000);
    this.execMaxOutputBytes = this.config.get<number>(
      'SSH_EXEC_MAX_OUTPUT_BYTES',
      1_000_000,
    );
    this.maxConcurrentConnections = this.config.get<number>(
      'SSH_MAX_CONCURRENT_CONNECTIONS',
      50,
    );
    this.connectionIdleTimeoutMs = this.config.get<number>(
      'SSH_CONNECTION_IDLE_TIMEOUT_MS',
      300_000,
    );
  }

  onModuleDestroy() {
    for (const [hostId, entry] of this.connections) {
      if (entry.reconnectTimer) {
        clearTimeout(entry.reconnectTimer);
      }
      entry.client.end();
      this.logger.log(`Closed connection to host ${hostId}`);
    }
    this.connections.clear();
  }

  async connect(hostId: string) {
    if (
      !this.connections.has(hostId) &&
      this.connections.size >= this.maxConcurrentConnections
    ) {
      this.pruneIdleConnections();

      if (this.connections.size >= this.maxConcurrentConnections) {
        throw new BadRequestException('connection_limit_reached');
      }
    }

    const host = await this.prisma.host.findUnique({
      where: { id: hostId },
    });

    if (!host) {
      throw new NotFoundException('host_not_found');
    }

    if (host.type !== 'ssh') {
      throw new BadRequestException('host_not_ssh');
    }

    await this.establishConnection(hostId, {
      hostname: host.hostname!,
      port: host.port ?? 22,
      username: host.username!,
      password: host.password
        ? this.encryption.decrypt(host.password)
        : undefined,
      storedFingerprint: host.hostKeyFingerprint ?? undefined,
    });
  }

  disconnect(hostId: string) {
    const entry = this.connections.get(hostId);
    if (!entry) return;

    if (entry.reconnectTimer) {
      clearTimeout(entry.reconnectTimer);
    }

    entry.client.end();
    this.connections.delete(hostId);
    this.logger.log(`Disconnected from host ${hostId}`);
  }

  async getConnection(hostId: string) {
    const entry = this.connections.get(hostId);
    if (entry?.status === 'connected') {
      entry.lastUsedAt = Date.now();
      return entry.client;
    }

    await this.connect(hostId);
    const newEntry = this.connections.get(hostId);
    return newEntry!.client;
  }

  getStatus(hostId: string): ConnectionStatusResult {
    const entry = this.connections.get(hostId);

    if (!entry) return { status: 'disconnected' };
    return { status: entry.status, message: entry.message };
  }

  async testConnection(
    config: TestConnectionDto,
  ): Promise<TestConnectionResult> {
    let password = config.password;

    if (!password && config.hostId) {
      const host = await this.prisma.host.findUnique({
        where: { id: config.hostId },
      });
      if (host?.password) {
        password = this.encryption.decrypt(host.password);
      }
    }

    const client = new Client();

    return new Promise(resolve => {
      let fingerprint: string | undefined;

      const timeout = setTimeout(() => {
        client.end();
        resolve({ success: false, message: 'Connection timed out' });
      }, this.testTimeoutMs);

      const onReady = () => {
        clearTimeout(timeout);
        client.end();
        resolve({
          success: true,
          message: 'Connection successful',
          fingerprint,
        });
      };

      const onError = (error: Error) => {
        clearTimeout(timeout);
        client.end();
        resolve({
          success: false,
          message:
            error.message === 'All configured authentication methods failed'
              ? 'Invalid username or password'
              : this.sanitizeErrorMessage(error.message),
        });
      };

      client
        .on('ready', onReady)
        .on('error', onError)
        .connect({
          host: config.hostname,
          port: config.port ?? 22,
          username: config.username,
          password,
          readyTimeout: this.testTimeoutMs,
          hostVerifier: (hostKey: Buffer) => {
            fingerprint = this.computeFingerprint(hostKey);
            return true;
          },
        });
    });
  }

  async exec(hostId: string, command: string): Promise<ExecResult> {
    const client = await this.getConnection(hostId);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Command execution timed out'));
      }, this.execTimeoutMs);

      client.exec(command, (error, stream) => {
        if (error) {
          clearTimeout(timeout);
          reject(error);
          return;
        }

        let stdout = '';
        let stderr = '';

        const onClose = (code: number) => {
          clearTimeout(timeout);
          resolve({ stdout, stderr, exitCode: code ?? 0 });
        };

        const onStdout = (data: Buffer) => {
          stdout += data.toString();
          if (stdout.length > this.execMaxOutputBytes) {
            clearTimeout(timeout);
            stream.close();
            reject(new Error('Command output too large'));
          }
        };

        const onStderr = (data: Buffer) => {
          stderr += data.toString();
          if (stderr.length > this.execMaxOutputBytes) {
            clearTimeout(timeout);
            stream.close();
            reject(new Error('Command error output too large'));
          }
        };

        stream
          .on('close', onClose)
          .on('data', onStdout)
          .stderr.on('data', onStderr);
      });
    });
  }

  async browse(hostId: string, path?: string): Promise<BrowseResult> {
    const cdPrefix = path ? `cd ${shellEscape(path)} && ` : '';
    const pathResult = await this.exec(hostId, `${cdPrefix}pwd`);

    if (pathResult.stderr.includes('Permission denied')) {
      throw new BadRequestException('permission_denied');
    }

    if (pathResult.exitCode !== 0) {
      throw new BadRequestException('path_not_found');
    }

    const resolvedPath = pathResult.stdout.trim();
    const lsResult = await this.exec(
      hostId,
      `ls -1d ${shellEscape(resolvedPath)}/*/  2>/dev/null`,
    );

    const entries: DirectoryEntry[] = lsResult.stdout
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => ({
        name: line.replace(/\/$/, '').split('/').pop()!,
        type: 'directory' as const,
        size: 0,
      }));

    const parentPath = resolvedPath === '/' ? null : dirname(resolvedPath);

    return { path: resolvedPath, parentPath, entries };
  }

  private establishConnection(hostId: string, config: ConnectionConfig) {
    return new Promise<void>((resolve, reject) => {
      const client = new Client();
      let pendingFingerprint: string | undefined;

      const entry: ConnectionEntry = {
        client,
        status: 'connecting',
        reconnectAttempts: 0,
        lastUsedAt: Date.now(),
      };
      this.connections.set(hostId, entry);

      const onReady = () => {
        entry.status = 'connected';
        entry.message = undefined;
        entry.reconnectAttempts = 0;
        this.logger.log(`Connected to host ${hostId}`);

        if (pendingFingerprint) {
          this.prisma.host
            .update({
              where: { id: hostId },
              data: { hostKeyFingerprint: pendingFingerprint },
            })
            .then(() => {
              this.logger.log(`Stored host key fingerprint for ${hostId}`);
              resolve();
            })
            .catch((error: Error) => {
              this.logger.warn(
                `Failed to store host key fingerprint for ${hostId}: ${error.message}`,
              );
              resolve();
            });
        } else {
          resolve();
        }
      };

      const onError = (error: Error) => {
        entry.status = 'error';
        entry.message = this.sanitizeErrorMessage(error.message);
        this.logger.warn(`SSH error for host ${hostId}`);
        reject(error);
      };

      const onClose = () => {
        if (entry.status === 'connected') {
          entry.status = 'disconnected';
          this.logger.log(
            `Connection closed for host ${hostId}, scheduling reconnect`,
          );
          this.scheduleReconnect(hostId, config);
        }
      };

      client
        .on('ready', onReady)
        .on('error', onError)
        .on('close', onClose)
        .connect({
          host: config.hostname,
          port: config.port,
          username: config.username,
          password: config.password,
          keepaliveInterval: this.keepaliveInterval,
          keepaliveCountMax: this.keepaliveCountMax,
          hostVerifier: (hostKey: Buffer) => {
            return this.verifyHostKey(
              hostId,
              hostKey,
              config.storedFingerprint,
              fingerprint => {
                pendingFingerprint = fingerprint;
              },
            );
          },
        });
    });
  }

  private scheduleReconnect(hostId: string, config: ConnectionConfig) {
    const entry = this.connections.get(hostId);
    if (!entry) return;

    if (entry.reconnectAttempts >= this.reconnectMaxAttempts) {
      entry.status = 'error';
      entry.message = 'Max reconnection attempts reached';
      this.logger.warn(`Max reconnect attempts reached for host ${hostId}`);
      return;
    }

    const delay = this.reconnectBaseMs * Math.pow(2, entry.reconnectAttempts);
    entry.reconnectAttempts++;

    this.logger.log(
      `Reconnecting to host ${hostId} in ${delay}ms (attempt ${entry.reconnectAttempts})`,
    );

    entry.reconnectTimer = setTimeout(() => {
      const currentAttempts = entry.reconnectAttempts;

      void this.establishConnection(hostId, config).catch(() => {
        this.logger.warn(`Reconnect failed for host ${hostId}`);
        const newEntry = this.connections.get(hostId);

        if (newEntry) {
          newEntry.reconnectAttempts = currentAttempts;
          this.scheduleReconnect(hostId, config);
        }
      });
    }, delay);
  }

  private verifyHostKey(
    hostId: string,
    hostKey: Buffer,
    storedFingerprint: string | undefined,
    onNewFingerprint: (fingerprint: string) => void,
  ) {
    const fingerprint = this.computeFingerprint(hostKey);

    if (!storedFingerprint) {
      onNewFingerprint(fingerprint);
      return true;
    }
    if (storedFingerprint === fingerprint) return true;

    this.logger.error(
      `Host key mismatch for ${hostId}: expected ${storedFingerprint}, got ${fingerprint}`,
    );
    return false;
  }

  computeFingerprint(hostKey: Buffer) {
    const hash = createHash('sha256').update(hostKey).digest('base64');
    return `SHA256:${hash}`;
  }

  private pruneIdleConnections() {
    const now = Date.now();
    const idleHostIds: string[] = [];

    for (const [hostId, entry] of this.connections) {
      if (now - entry.lastUsedAt > this.connectionIdleTimeoutMs) {
        idleHostIds.push(hostId);
      }
    }

    for (const hostId of idleHostIds) {
      this.logger.log(`Disconnecting idle connection: ${hostId}`);
      this.disconnect(hostId);
    }
  }

  private sanitizeErrorMessage(rawMessage: string) {
    const sanitized = rawMessage
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?\b/g, '[redacted]')
      .replace(/connect ECONNREFUSED.*/g, 'Connection refused')
      .replace(/ENOTFOUND.*/g, 'Host not found')
      .replace(/ETIMEDOUT.*/g, 'Connection timed out')
      .replace(/EHOSTUNREACH.*/g, 'Host unreachable');

    if (sanitized.length > 200) {
      return 'Connection failed';
    }

    return sanitized;
  }
}
