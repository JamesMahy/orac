import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SshService } from '../ssh.service';
import { PrismaService } from '@database/prisma.service';
import { EncryptionService } from '@common/crypto/encryption.service';

type MockClient = {
  on: jest.Mock;
  connect: jest.Mock;
  end: jest.Mock;
  exec: jest.Mock;
  __handlers: Record<string, ((...args: unknown[]) => void)[]>;
  __trigger: (event: string, ...args: unknown[]) => void;
  __reset: () => void;
};

type HostVerifierConfig = {
  hostVerifier: (key: Buffer) => boolean;
};

type MockStream = {
  on: jest.Mock;
  close: jest.Mock;
  stderr: { on: jest.Mock };
  __triggerData: (data: string) => void;
  __triggerStderr: (data: string) => void;
  __triggerClose: (code?: number) => void;
};

function createMockStream(): MockStream {
  const streamHandlers: Record<string, ((...args: unknown[]) => void)[]> = {};
  const stderrHandlers: Record<string, ((...args: unknown[]) => void)[]> = {};

  const stream: MockStream = {
    on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!streamHandlers[event]) streamHandlers[event] = [];
      streamHandlers[event].push(handler);
      return stream;
    }),
    close: jest.fn(),
    stderr: {
      on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (!stderrHandlers[event]) stderrHandlers[event] = [];
        stderrHandlers[event].push(handler);
        return stream.stderr;
      }),
    },
    __triggerData: (data: string) => {
      streamHandlers['data']?.forEach(handler => handler(Buffer.from(data)));
    },
    __triggerStderr: (data: string) => {
      stderrHandlers['data']?.forEach(handler => handler(Buffer.from(data)));
    },
    __triggerClose: (code?: number) => {
      streamHandlers['close']?.forEach(handler => handler(code));
    },
  };

  return stream;
}

jest.mock('ssh2', () => {
  const handlers: Record<string, ((...args: unknown[]) => void)[]> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = {
    on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(handler);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return client;
    }),
    connect: jest.fn(),
    end: jest.fn(),
    exec: jest.fn(),
    __handlers: handlers,
    __trigger: (event: string, ...args: unknown[]) => {
      if (handlers[event]) {
        handlers[event].forEach(handler => handler(...args));
      }
    },
    __reset: () => {
      Object.keys(handlers).forEach(key => delete handlers[key]);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      client.on.mockClear();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      client.connect.mockClear();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      client.end.mockClear();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      client.exec.mockClear();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      client.on.mockImplementation(
        (event: string, handler: (...args: unknown[]) => void) => {
          if (!handlers[event]) handlers[event] = [];
          handlers[event].push(handler);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return client;
        },
      );
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
  return { Client: jest.fn(() => client), __mockClient: client };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mockClient } = require('ssh2') as {
  __mockClient: MockClient;
};
const mockClient: MockClient = __mockClient;

const mockSshHost = {
  hostId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test SSH Host',
  type: 'ssh',
  hostname: '192.168.1.1',
  port: 22,
  username: 'root',
  password: 'encrypted_pw',
  hostKeyFingerprint: null,
  endpoint: null,
  apiKey: null,
  provider: null,
  model: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockApiHost = {
  ...mockSshHost,
  hostId: '550e8400-e29b-41d4-a716-446655440001',
  type: 'api',
  hostname: null,
  port: null,
  username: null,
  password: null,
};

function getHostVerifier(): HostVerifierConfig {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return mockClient.connect.mock.calls[0][0] as HostVerifierConfig;
}

async function connectHost(
  service: SshService,
  prisma: { host: Record<string, jest.Mock> },
): Promise<void> {
  prisma.host.findUnique.mockResolvedValue(mockSshHost);
  const connectPromise = service.connect(mockSshHost.hostId);
  await new Promise(resolve => setTimeout(resolve, 0));
  mockClient.__trigger('ready');
  await connectPromise;
}

describe('SshService', () => {
  let service: SshService;
  let prisma: { host: Record<string, jest.Mock> };
  let encryption: { decrypt: jest.Mock; encrypt: jest.Mock };

  beforeEach(async () => {
    mockClient.__reset();

    prisma = {
      host: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    encryption = {
      decrypt: jest.fn().mockReturnValue('decrypted_password'),
      encrypt: jest.fn().mockReturnValue('encrypted_value'),
    };

    const configService = {
      get: jest.fn((_key: string, defaultValue: number) => defaultValue),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SshService,
        { provide: PrismaService, useValue: prisma },
        { provide: EncryptionService, useValue: encryption },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(SshService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('connect', () => {
    it('should throw NotFoundException when host not found', async () => {
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(service.connect('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for non-SSH host', async () => {
      prisma.host.findUnique.mockResolvedValue(mockApiHost);

      await expect(service.connect(mockApiHost.hostId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should establish connection for SSH host', async () => {
      await connectHost(service, prisma);

      expect(mockClient.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          host: '192.168.1.1',
          port: 22,
          username: 'root',
          password: 'decrypted_password',
        }),
      );
    });

    it('should decrypt password before connecting', async () => {
      await connectHost(service, prisma);

      expect(encryption.decrypt).toHaveBeenCalledWith('encrypted_pw');
    });

    it('should connect without password when not set', async () => {
      prisma.host.findUnique.mockResolvedValue({
        ...mockSshHost,
        password: null,
      });

      const connectPromise = service.connect(mockSshHost.hostId);
      await new Promise(resolve => setTimeout(resolve, 0));
      mockClient.__trigger('ready');
      await connectPromise;

      expect(encryption.decrypt).not.toHaveBeenCalled();
      expect(mockClient.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          password: undefined,
        }),
      );
    });

    it('should reject when SSH error occurs', async () => {
      prisma.host.findUnique.mockResolvedValue(mockSshHost);

      const connectPromise = service.connect(mockSshHost.hostId);
      await new Promise(resolve => setTimeout(resolve, 0));
      mockClient.__trigger('error', new Error('Connection refused'));

      await expect(connectPromise).rejects.toThrow('Connection refused');
    });

    it('should reject when connection limit is reached', async () => {
      // Simulate a full pool by accessing the private connections Map
      const connections = (
        service as unknown as {
          connections: Map<string, unknown>;
        }
      ).connections;

      for (let i = 0; i < 50; i++) {
        connections.set(`host-${i}`, {
          client: mockClient,
          status: 'connected',
          reconnectAttempts: 0,
          lastUsedAt: Date.now(),
        });
      }

      prisma.host.findUnique.mockResolvedValue({
        ...mockSshHost,
        hostId: 'one-too-many',
      });

      await expect(service.connect('one-too-many')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('disconnect', () => {
    it('should close connection and remove from pool', async () => {
      await connectHost(service, prisma);

      service.disconnect(mockSshHost.hostId);

      expect(mockClient.end).toHaveBeenCalled();
      expect(service.getStatus(mockSshHost.hostId)).toEqual({
        status: 'disconnected',
      });
    });

    it('should do nothing for unknown hostId', () => {
      expect(() => service.disconnect('unknown')).not.toThrow();
    });

    it('should clear reconnect timer when disconnecting', async () => {
      await connectHost(service, prisma);
      jest.useFakeTimers();

      mockClient.__trigger('close');
      service.disconnect(mockSshHost.hostId);

      jest.advanceTimersByTime(10_000);
      // Only the initial connect call, no reconnect
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });

  describe('getConnection', () => {
    it('should return existing client when already connected', async () => {
      await connectHost(service, prisma);

      const client = await service.getConnection(mockSshHost.hostId);

      expect(client).toBe(mockClient);
      // Only one findUnique call from initial connect
      expect(prisma.host.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should establish new connection when not connected', async () => {
      prisma.host.findUnique.mockResolvedValue(mockSshHost);

      const clientPromise = service.getConnection(mockSshHost.hostId);
      await new Promise(resolve => setTimeout(resolve, 0));
      mockClient.__trigger('ready');
      const client = await clientPromise;

      expect(client).toBe(mockClient);
      expect(prisma.host.findUnique).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should return disconnected for unknown host', () => {
      expect(service.getStatus('unknown')).toEqual({
        status: 'disconnected',
      });
    });

    it('should return connected after successful connect', async () => {
      await connectHost(service, prisma);

      expect(service.getStatus(mockSshHost.hostId)).toEqual({
        status: 'connected',
        message: undefined,
      });
    });

    it('should return error status after connection error', async () => {
      prisma.host.findUnique.mockResolvedValue(mockSshHost);
      const connectPromise = service.connect(mockSshHost.hostId);
      await new Promise(resolve => setTimeout(resolve, 0));
      mockClient.__trigger('error', new Error('Auth failed'));

      await connectPromise.catch(() => {});

      const status = service.getStatus(mockSshHost.hostId);
      expect(status.status).toBe('error');
      expect(status.message).toBe('Auth failed');
    });
  });

  describe('testConnection', () => {
    it('should return success for valid connection', async () => {
      const resultPromise = service.testConnection({
        hostname: '192.168.1.1',
        username: 'root',
        password: 'secret',
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      mockClient.__trigger('ready');

      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(result.message).toBe('Connection successful');
    });

    it('should return failure on error', async () => {
      const resultPromise = service.testConnection({
        hostname: '192.168.1.1',
        username: 'root',
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      mockClient.__trigger('error', new Error('Connection refused'));

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.message).toBe('Connection refused');
    });

    it('should use default port 22 when not specified', async () => {
      const resultPromise = service.testConnection({
        hostname: '192.168.1.1',
        username: 'root',
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      mockClient.__trigger('ready');
      await resultPromise;

      expect(mockClient.connect).toHaveBeenCalledWith(
        expect.objectContaining({ port: 22 }),
      );
    });

    it('should always accept host keys (return fingerprint)', async () => {
      const resultPromise = service.testConnection({
        hostname: '192.168.1.1',
        username: 'root',
      });

      await new Promise(resolve => setTimeout(resolve, 0));

      const connectConfig = getHostVerifier();
      const accepted = connectConfig.hostVerifier(Buffer.from('test-key'));
      expect(accepted).toBe(true);

      mockClient.__trigger('ready');
      const result = await resultPromise;
      expect(result.fingerprint).toBeDefined();
    });

    it('should close client after success', async () => {
      const resultPromise = service.testConnection({
        hostname: '192.168.1.1',
        username: 'root',
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      mockClient.__trigger('ready');
      await resultPromise;

      expect(mockClient.end).toHaveBeenCalled();
    });

    it('should close client after error', async () => {
      const resultPromise = service.testConnection({
        hostname: '192.168.1.1',
        username: 'root',
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      mockClient.__trigger('error', new Error('fail'));
      await resultPromise;

      expect(mockClient.end).toHaveBeenCalled();
    });

    it('should timeout after 10 seconds and return failure', async () => {
      jest.useFakeTimers();

      const resultPromise = service.testConnection({
        hostname: '192.168.1.1',
        username: 'root',
      });

      jest.advanceTimersByTime(10_000);

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.message).toBe('Connection timed out');
      expect(mockClient.end).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should use stored password when hostId is provided and no password given', async () => {
      prisma.host.findUnique.mockResolvedValue(mockSshHost);

      const resultPromise = service.testConnection({
        hostname: '192.168.1.1',
        username: 'root',
        hostId: mockSshHost.hostId,
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      mockClient.__trigger('ready');

      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(encryption.decrypt).toHaveBeenCalledWith('encrypted_pw');
      expect(mockClient.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'decrypted_password',
        }),
      );
    });

    it('should use provided password over stored password when both available', async () => {
      const resultPromise = service.testConnection({
        hostname: '192.168.1.1',
        username: 'root',
        password: 'explicit_password',
        hostId: mockSshHost.hostId,
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      mockClient.__trigger('ready');

      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(encryption.decrypt).not.toHaveBeenCalled();
      expect(mockClient.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'explicit_password',
        }),
      );
    });

    it('should sanitize error messages containing IPs', async () => {
      const resultPromise = service.testConnection({
        hostname: 'myhost',
        username: 'root',
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      mockClient.__trigger(
        'error',
        new Error('connect ECONNREFUSED 10.0.2.15:22'),
      );

      const result = await resultPromise;
      expect(result.message).toBe('Connection refused');
      expect(result.message).not.toContain('10.0.2.15');
    });
  });

  describe('exec', () => {
    it('should execute command and return stdout', async () => {
      await connectHost(service, prisma);

      const stream = createMockStream();
      mockClient.exec.mockImplementation(
        (
          _command: string,
          callback: (error: Error | null, stream: MockStream) => void,
        ) => {
          callback(null, stream);
          stream.__triggerData('hello world');
          stream.__triggerClose(0);
        },
      );

      const result = await service.exec(mockSshHost.hostId, 'echo hello');

      expect(result).toEqual({
        stdout: 'hello world',
        stderr: '',
        exitCode: 0,
      });
      expect(mockClient.exec).toHaveBeenCalledWith(
        'echo hello',
        expect.any(Function),
      );
    });

    it('should capture stderr output', async () => {
      await connectHost(service, prisma);

      const stream = createMockStream();
      mockClient.exec.mockImplementation(
        (
          _command: string,
          callback: (error: Error | null, stream: MockStream) => void,
        ) => {
          callback(null, stream);
          stream.__triggerStderr('error output');
          stream.__triggerClose(1);
        },
      );

      const result = await service.exec(mockSshHost.hostId, 'bad-command');

      expect(result.stderr).toBe('error output');
      expect(result.exitCode).toBe(1);
    });

    it('should reject when exec returns error', async () => {
      await connectHost(service, prisma);

      mockClient.exec.mockImplementation(
        (
          _command: string,
          callback: (error: Error | null, stream: unknown) => void,
        ) => {
          callback(new Error('exec failed'), null);
        },
      );

      await expect(service.exec(mockSshHost.hostId, 'ls')).rejects.toThrow(
        'exec failed',
      );
    });

    it('should default exitCode to 0 when code is undefined', async () => {
      await connectHost(service, prisma);

      const stream = createMockStream();
      mockClient.exec.mockImplementation(
        (
          _command: string,
          callback: (error: Error | null, stream: MockStream) => void,
        ) => {
          callback(null, stream);
          stream.__triggerClose(undefined as unknown as number);
        },
      );

      const result = await service.exec(mockSshHost.hostId, 'ls');

      expect(result.exitCode).toBe(0);
    });

    it('should reject when stdout exceeds max output size', async () => {
      await connectHost(service, prisma);

      const stream = createMockStream();
      mockClient.exec.mockImplementation(
        (
          _command: string,
          callback: (error: Error | null, stream: MockStream) => void,
        ) => {
          callback(null, stream);
          // Send data exceeding 1MB
          stream.__triggerData('x'.repeat(1_000_001));
        },
      );

      await expect(service.exec(mockSshHost.hostId, 'ls')).rejects.toThrow(
        'Command output too large',
      );
      expect(stream.close).toHaveBeenCalled();
    });

    it('should reject when stderr exceeds max output size', async () => {
      await connectHost(service, prisma);

      const stream = createMockStream();
      mockClient.exec.mockImplementation(
        (
          _command: string,
          callback: (error: Error | null, stream: MockStream) => void,
        ) => {
          callback(null, stream);
          stream.__triggerStderr('x'.repeat(1_000_001));
        },
      );

      await expect(service.exec(mockSshHost.hostId, 'ls')).rejects.toThrow(
        'Command error output too large',
      );
      expect(stream.close).toHaveBeenCalled();
    });

    it('should reject when execution times out', async () => {
      await connectHost(service, prisma);
      jest.useFakeTimers();

      const stream = createMockStream();
      mockClient.exec.mockImplementation(
        (
          _command: string,
          callback: (error: Error | null, stream: MockStream) => void,
        ) => {
          callback(null, stream);
          // Never close the stream — simulate a hung command
        },
      );

      const execPromise = service.exec(mockSshHost.hostId, 'sleep 999');

      // Set up rejection handler before advancing timers
      const expectation = expect(execPromise).rejects.toThrow(
        'Command execution timed out',
      );

      await jest.advanceTimersByTimeAsync(30_000);

      await expectation;

      jest.useRealTimers();
    });
  });

  describe('TOFU host key verification', () => {
    it('should store fingerprint on first connect (no stored fingerprint)', async () => {
      prisma.host.findUnique.mockResolvedValue(mockSshHost);
      prisma.host.update.mockResolvedValue(mockSshHost);

      const connectPromise = service.connect(mockSshHost.hostId);
      await new Promise(resolve => setTimeout(resolve, 0));

      const connectConfig = getHostVerifier();
      const accepted = connectConfig.hostVerifier(Buffer.from('test-host-key'));
      expect(accepted).toBe(true);

      mockClient.__trigger('ready');
      await connectPromise;

      // DB write now completes before connect resolves
      expect(prisma.host.update).toHaveBeenCalledWith({
        where: { hostId: mockSshHost.hostId },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          hostKeyFingerprint: expect.stringContaining('SHA256:'),
        },
      });
    });

    it('should accept matching fingerprint', async () => {
      const fingerprint = service.computeFingerprint(
        Buffer.from('test-host-key'),
      );
      prisma.host.findUnique.mockResolvedValue({
        ...mockSshHost,
        hostKeyFingerprint: fingerprint,
      });

      const connectPromise = service.connect(mockSshHost.hostId);
      await new Promise(resolve => setTimeout(resolve, 0));

      const connectConfig = getHostVerifier();
      const accepted = connectConfig.hostVerifier(Buffer.from('test-host-key'));
      expect(accepted).toBe(true);

      mockClient.__trigger('ready');
      await connectPromise;
    });

    it('should reject mismatched fingerprint', async () => {
      prisma.host.findUnique.mockResolvedValue({
        ...mockSshHost,
        hostKeyFingerprint: 'SHA256:wrong-fingerprint',
      });

      void service.connect(mockSshHost.hostId);
      await new Promise(resolve => setTimeout(resolve, 0));

      const connectConfig = getHostVerifier();
      const accepted = connectConfig.hostVerifier(Buffer.from('test-host-key'));
      expect(accepted).toBe(false);
    });

    it('should continue even if storing fingerprint fails', async () => {
      prisma.host.findUnique.mockResolvedValue(mockSshHost);
      prisma.host.update.mockRejectedValue(new Error('DB error'));

      const connectPromise = service.connect(mockSshHost.hostId);
      await new Promise(resolve => setTimeout(resolve, 0));

      const connectConfig = getHostVerifier();
      const accepted = connectConfig.hostVerifier(Buffer.from('test-key'));
      expect(accepted).toBe(true);

      mockClient.__trigger('ready');
      // Connection still resolves even if fingerprint storage fails
      await connectPromise;
    });
  });

  describe('automatic reconnection', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should schedule reconnect when connection closes unexpectedly', async () => {
      await connectHost(service, prisma);
      jest.useFakeTimers();

      mockClient.__trigger('close');

      jest.advanceTimersByTime(2_000);
      // Initial connect + reconnect attempt
      expect(mockClient.connect).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff for reconnection', async () => {
      await connectHost(service, prisma);
      jest.useFakeTimers();

      mockClient.__trigger('close');

      // First attempt at 2s
      jest.advanceTimersByTime(1_999);
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(1);
      expect(mockClient.connect).toHaveBeenCalledTimes(2);
    });

    it('should stop reconnecting after max attempts', async () => {
      await connectHost(service, prisma);
      jest.useFakeTimers();

      // Simulate close -> reconnect fails 3 times
      mockClient.__trigger('close');

      for (let attempt = 0; attempt < 3; attempt++) {
        const delay = 2_000 * Math.pow(2, attempt);
        await jest.advanceTimersByTimeAsync(delay);
        // Trigger error for the reconnect attempt
        mockClient.__trigger('error', new Error('fail'));
        // Flush catch handler which calls scheduleReconnect
        await jest.advanceTimersByTimeAsync(0);
      }

      const status = service.getStatus(mockSshHost.hostId);
      expect(status.status).toBe('error');
      expect(status.message).toBe('Max reconnection attempts reached');
    });

    it('should not schedule reconnect if entry is removed', async () => {
      await connectHost(service, prisma);
      jest.useFakeTimers();

      service.disconnect(mockSshHost.hostId);
      // Triggering close on disconnected host should not throw
      mockClient.__trigger('close');

      jest.advanceTimersByTime(10_000);
      // Only initial connect, no reconnect
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should sanitize error with ECONNREFUSED', async () => {
      prisma.host.findUnique.mockResolvedValue(mockSshHost);
      const connectPromise = service.connect(mockSshHost.hostId);
      await new Promise(resolve => setTimeout(resolve, 0));
      mockClient.__trigger(
        'error',
        new Error('connect ECONNREFUSED 10.0.2.15:22'),
      );

      await connectPromise.catch(() => {});

      const status = service.getStatus(mockSshHost.hostId);
      expect(status.message).toBe('Connection refused');
    });

    it('should sanitize error with ENOTFOUND', async () => {
      prisma.host.findUnique.mockResolvedValue(mockSshHost);
      const connectPromise = service.connect(mockSshHost.hostId);
      await new Promise(resolve => setTimeout(resolve, 0));
      mockClient.__trigger(
        'error',
        new Error('ENOTFOUND bad.host.example.com'),
      );

      await connectPromise.catch(() => {});

      const status = service.getStatus(mockSshHost.hostId);
      expect(status.message).toBe('Host not found');
    });
  });

  describe('computeFingerprint', () => {
    it('should return SHA256 prefixed fingerprint', () => {
      const fingerprint = service.computeFingerprint(Buffer.from('test-key'));
      expect(fingerprint).toMatch(/^SHA256:.+$/);
    });

    it('should return consistent fingerprints for same key', () => {
      const key = Buffer.from('consistent-key');
      const first = service.computeFingerprint(key);
      const second = service.computeFingerprint(key);
      expect(first).toBe(second);
    });

    it('should return different fingerprints for different keys', () => {
      const first = service.computeFingerprint(Buffer.from('key-1'));
      const second = service.computeFingerprint(Buffer.from('key-2'));
      expect(first).not.toBe(second);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close all connections', async () => {
      await connectHost(service, prisma);

      service.onModuleDestroy();

      expect(mockClient.end).toHaveBeenCalled();
      expect(service.getStatus(mockSshHost.hostId)).toEqual({
        status: 'disconnected',
      });
    });

    it('should clear reconnect timers on shutdown', async () => {
      await connectHost(service, prisma);
      jest.useFakeTimers();

      mockClient.__trigger('close');

      service.onModuleDestroy();

      jest.advanceTimersByTime(10_000);
      // Only initial connect, no reconnect
      expect(mockClient.connect).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('browse', () => {
    type ExecResponse = { stdout: string; stderr?: string; exitCode?: number };

    function setupBrowse(pwdResponse: ExecResponse, lsResponse: ExecResponse) {
      let callIndex = 0;
      mockClient.exec.mockImplementation(
        (
          _command: string,
          callback: (error: Error | null, stream: MockStream) => void,
        ) => {
          const response = callIndex === 0 ? pwdResponse : lsResponse;
          callIndex++;
          const stream = createMockStream();
          callback(null, stream);
          if (response.stdout) stream.__triggerData(response.stdout);
          if (response.stderr) stream.__triggerStderr(response.stderr);
          stream.__triggerClose(response.exitCode ?? 0);
        },
      );
    }

    it('should return directories from listing', async () => {
      await connectHost(service, prisma);
      setupBrowse(
        { stdout: '/home/james/Development\n' },
        {
          stdout:
            '/home/james/Development/src/\n/home/james/Development/docs/\n',
        },
      );

      const result = await service.browse(
        mockSshHost.hostId,
        '/home/james/Development',
      );

      expect(result.path).toBe('/home/james/Development');
      expect(result.parentPath).toBe('/home/james');
      expect(result.entries).toHaveLength(2);
      expect(result.entries.map(entry => entry.name)).toEqual(['src', 'docs']);
    });

    it('should throw path_not_found when cd fails', async () => {
      await connectHost(service, prisma);
      setupBrowse(
        { stdout: '', stderr: 'No such file or directory', exitCode: 1 },
        { stdout: '' },
      );

      await expect(
        service.browse(mockSshHost.hostId, '/nonexistent'),
      ).rejects.toThrow('path_not_found');
    });

    it('should throw permission_denied on stderr check', async () => {
      await connectHost(service, prisma);
      setupBrowse(
        { stdout: '', stderr: 'Permission denied', exitCode: 1 },
        { stdout: '' },
      );

      await expect(
        service.browse(mockSshHost.hostId, '/root/secret'),
      ).rejects.toThrow('permission_denied');
    });

    it('should return null parentPath at root', async () => {
      await connectHost(service, prisma);
      setupBrowse({ stdout: '/\n' }, { stdout: '/bin/\n/etc/\n' });

      const result = await service.browse(mockSshHost.hostId, '/');

      expect(result.parentPath).toBeNull();
    });

    it('should not use cd when no path given', async () => {
      await connectHost(service, prisma);
      setupBrowse(
        { stdout: '/home/james\n' },
        { stdout: '/home/james/Dev/\n' },
      );

      await service.browse(mockSshHost.hostId);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const executedCommand = mockClient.exec.mock.calls[0][0] as string;
      expect(executedCommand).toBe('pwd');
    });

    it('should handle empty directory', async () => {
      await connectHost(service, prisma);
      setupBrowse({ stdout: '/home/james/empty\n' }, { stdout: '' });

      const result = await service.browse(
        mockSshHost.hostId,
        '/home/james/empty',
      );

      expect(result.entries).toHaveLength(0);
      expect(result.path).toBe('/home/james/empty');
    });

    it('should return empty entries when ls fails', async () => {
      await connectHost(service, prisma);
      setupBrowse({ stdout: '/home/james\n' }, { stdout: '', exitCode: 2 });

      const result = await service.browse(mockSshHost.hostId, '/home/james');

      expect(result.entries).toHaveLength(0);
      expect(result.path).toBe('/home/james');
    });
  });
});
