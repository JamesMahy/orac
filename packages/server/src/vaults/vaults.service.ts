import {
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { EncryptionService } from '@common/crypto/encryption.service';
import { WorkspacesService } from '@workspaces/workspaces.service';
import { VaultAdaptersService } from './vaultAdapters.service';
import { VaultAdapter } from '@vaults/base';
import type { S3Connection } from '@vaults/implementations';
import {
  sanitizeObject,
  validateConfig,
  encryptSecureFields,
  decryptSecureFields,
  maskSecureFields,
} from '@helpers/config';
import { CreateVaultDto, UpdateVaultDto } from './vaults.dto';

type VaultResponse = {
  vaultId: string;
  name: string;
  vaultAdapterId: string;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class VaultsService implements OnModuleInit {
  private readonly logger = new Logger(VaultsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly vaultAdapters: VaultAdaptersService,
    private readonly workspaces: WorkspacesService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      const { adapter, connection } = this.getDefaultVault();
      await adapter.ensureBucket(connection);
      this.logger.log('Default storage bucket verified');
    } catch (error) {
      this.logger.warn('Failed to verify default storage bucket', error);
    }
  }

  async findAll(): Promise<VaultResponse[]> {
    const vaults = await this.prisma.vault.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return vaults.map(vault => {
      const adapter = this.vaultAdapters.getAdapter(vault.vaultAdapterId);
      return this.toResponse(vault, adapter);
    });
  }

  async findOne(vaultId: string): Promise<VaultResponse> {
    const vault = await this.prisma.vault.findUnique({ where: { vaultId } });
    if (!vault) {
      throw new NotFoundException('vault_not_found');
    }

    const adapter = this.vaultAdapters.getAdapter(vault.vaultAdapterId);
    return this.toResponse(vault, adapter);
  }

  async create(dto: CreateVaultDto, userId: string): Promise<VaultResponse> {
    const { name, vaultAdapterId, config: rawConfig } = dto;
    const adapter = this.vaultAdapters.getAdapter(vaultAdapterId);

    const config = sanitizeObject(rawConfig ?? {});
    validateConfig(adapter.fields, config);
    const encryptedConfig = encryptSecureFields(
      adapter.fields,
      config,
      this.encryption,
    );

    const vault = await this.prisma.vault.create({
      data: {
        userId,
        name,
        vaultAdapterId,
        config: encryptedConfig as Prisma.InputJsonValue,
      },
    });

    return this.toResponse(vault, adapter);
  }

  async update(vaultId: string, dto: UpdateVaultDto): Promise<VaultResponse> {
    const existing = await this.prisma.vault.findUnique({ where: { vaultId } });
    if (!existing) {
      throw new NotFoundException('vault_not_found');
    }

    const { name, config: rawConfig } = dto;
    const adapter = this.vaultAdapters.getAdapter(existing.vaultAdapterId);

    let config: Record<string, unknown> | undefined;
    if (rawConfig !== undefined) {
      const sanitizedConfig = sanitizeObject(rawConfig);
      validateConfig(adapter.fields, sanitizedConfig);
      config = encryptSecureFields(
        adapter.fields,
        sanitizedConfig,
        this.encryption,
      );
    }

    const data: Prisma.VaultUncheckedUpdateInput = {
      name,
      config: config as Prisma.InputJsonValue | undefined,
    };

    const vault = await this.prisma.vault.update({ where: { vaultId }, data });
    return this.toResponse(vault, adapter);
  }

  async remove(vaultId: string): Promise<void> {
    const existing = await this.prisma.vault.findUnique({ where: { vaultId } });
    if (!existing) {
      throw new NotFoundException('vault_not_found');
    }

    await this.prisma.vault.delete({ where: { vaultId } });
  }

  async getActiveVault(
    workspaceId: string,
  ): Promise<{ adapter: VaultAdapter; connection: unknown }> {
    const primaryVaultId =
      await this.workspaces.findPrimaryVaultId(workspaceId);

    if (!primaryVaultId) {
      return this.getDefaultVault();
    }

    const vault = await this.prisma.vault.findUnique({
      where: { vaultId: primaryVaultId },
    });

    if (!vault) {
      throw new NotFoundException('vault_not_found');
    }

    const adapter = this.vaultAdapters.getAdapter(vault.vaultAdapterId);
    const connection = decryptSecureFields(
      adapter.fields,
      vault.config as Record<string, unknown>,
      this.encryption,
    );

    return { adapter, connection };
  }

  getDefaultVault(): { adapter: VaultAdapter; connection: S3Connection } {
    const adapter = this.vaultAdapters.getAdapter('s3');
    const connection: S3Connection = {
      endpoint: this.config.getOrThrow<string>('RUSTFS_ENDPOINT'),
      bucket: this.config.getOrThrow<string>('RUSTFS_BUCKET'),
      region: 'us-east-1',
      accessKeyId: this.config.getOrThrow<string>('RUSTFS_ACCESS_KEY'),
      secretAccessKey: this.config.getOrThrow<string>('RUSTFS_SECRET_KEY'),
      forcePathStyle: true,
    };
    return { adapter, connection };
  }

  private toResponse(
    vault: Prisma.VaultGetPayload<object>,
    adapter: VaultAdapter,
  ): VaultResponse {
    return {
      vaultId: vault.vaultId,
      name: vault.name,
      vaultAdapterId: vault.vaultAdapterId,
      config: maskSecureFields(
        adapter.fields,
        vault.config as Record<string, unknown>,
      ),
      createdAt: vault.createdAt,
      updatedAt: vault.updatedAt,
    };
  }
}
