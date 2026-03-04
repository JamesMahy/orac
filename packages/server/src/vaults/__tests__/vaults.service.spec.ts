import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VaultsService } from '../vaults.service';
import { PrismaService } from '@database/prisma.service';
import { EncryptionService } from '@common/crypto/encryption.service';
import { VaultAdaptersService } from '../vaultAdapters.service';
import { WorkspacesService } from '@workspaces/workspaces.service';
import { ConfigService } from '@nestjs/config';

const mockS3Adapter = {
  vaultAdapterId: 's3',
  name: 'S3 Compatible',
  fields: [
    {
      key: 'endpoint',
      label: 'Endpoint URL',
      type: 'text' as const,
      required: true,
    },
    { key: 'bucket', label: 'Bucket', type: 'text' as const, required: true },
    { key: 'region', label: 'Region', type: 'text' as const, required: false },
    {
      key: 'accessKeyId',
      label: 'Access Key ID',
      type: 'text' as const,
      required: true,
      secure: true,
    },
    {
      key: 'secretAccessKey',
      label: 'Secret Access Key',
      type: 'text' as const,
      required: true,
      secure: true,
    },
    {
      key: 'forcePathStyle',
      label: 'Force Path Style',
      type: 'text' as const,
      required: false,
    },
  ],
  toDefinition: jest.fn(),
  upload: jest.fn(),
  download: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
};

const mockVault = {
  vaultId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Primary RustFS',
  vaultAdapterId: 's3',
  config: {
    endpoint: 'http://localhost:9000',
    bucket: 'orac',
    accessKeyId: 'encrypted_key',
    secretAccessKey: 'encrypted_secret',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('VaultsService', () => {
  let service: VaultsService;
  let prisma: { vault: Record<string, jest.Mock> };
  let encryption: { encrypt: jest.Mock; decrypt: jest.Mock };
  let vaultAdapters: { getAdapter: jest.Mock };
  let workspacesService: { findPrimaryVaultId: jest.Mock };
  let configService: { getOrThrow: jest.Mock };

  beforeEach(async () => {
    prisma = {
      vault: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    workspacesService = {
      findPrimaryVaultId: jest.fn(),
    };

    encryption = {
      encrypt: jest.fn().mockReturnValue('encrypted_value'),
      decrypt: jest.fn().mockReturnValue('decrypted_value'),
    };

    vaultAdapters = {
      getAdapter: jest.fn().mockReturnValue(mockS3Adapter),
    };

    configService = {
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        const values: Record<string, string> = {
          RUSTFS_ENDPOINT: 'http://orac.home.com:9000',
          RUSTFS_BUCKET: 'orac',
          RUSTFS_ACCESS_KEY: 'rustfsadmin',
          RUSTFS_SECRET_KEY: 'rustfsadmin',
        };
        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaultsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EncryptionService, useValue: encryption },
        { provide: VaultAdaptersService, useValue: vaultAdapters },
        { provide: WorkspacesService, useValue: workspacesService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<VaultsService>(VaultsService);
  });

  describe('findAll', () => {
    it('should return all vaults with masked secure fields', async () => {
      prisma.vault.findMany.mockResolvedValue([mockVault]);
      vaultAdapters.getAdapter.mockReturnValue(mockS3Adapter);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(prisma.vault.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result[0].config.accessKeyId).toBe(true);
      expect(result[0].config.secretAccessKey).toBe(true);
      expect(result[0].config.endpoint).toBe('http://localhost:9000');
    });

    it('should return empty array when no vaults exist', async () => {
      prisma.vault.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a vault with masked secure fields', async () => {
      prisma.vault.findUnique.mockResolvedValue(mockVault);
      vaultAdapters.getAdapter.mockReturnValue(mockS3Adapter);

      const result = await service.findOne(mockVault.vaultId);

      expect(result.name).toBe('Primary RustFS');
      expect(result.config.accessKeyId).toBe(true);
      expect(result.config.secretAccessKey).toBe(true);
      expect(prisma.vault.findUnique).toHaveBeenCalledWith({
        where: { vaultId: mockVault.vaultId },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.vault.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use snake_case error code', async () => {
      prisma.vault.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'vault_not_found',
      );
    });
  });

  describe('create', () => {
    it('should create a vault with encrypted secure fields', async () => {
      prisma.vault.create.mockResolvedValue(mockVault);

      await service.create({
        name: 'Primary RustFS',
        vaultAdapterId: 's3',
        config: {
          endpoint: 'http://localhost:9000',
          bucket: 'orac',
          accessKeyId: 'mykey',
          secretAccessKey: 'mysecret',
        },
      });

      expect(encryption.encrypt).toHaveBeenCalledWith('mykey');
      expect(encryption.encrypt).toHaveBeenCalledWith('mysecret');
      expect(prisma.vault.create).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          name: 'Primary RustFS',
          vaultAdapterId: 's3',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          config: expect.objectContaining({
            accessKeyId: 'encrypted_value',
            secretAccessKey: 'encrypted_value',
          }),
        }),
      });
    });

    it('should throw BadRequestException for missing required config field', async () => {
      await expect(
        service.create({
          name: 'RustFS',
          vaultAdapterId: 's3',
          config: { endpoint: 'http://localhost:9000' },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use snake_case error code for missing required field', async () => {
      await expect(
        service.create({
          name: 'RustFS',
          vaultAdapterId: 's3',
          config: { endpoint: 'http://localhost:9000' },
        }),
      ).rejects.toThrow('field_required:bucket');
    });

    it('should throw BadRequestException for non-string secure field', async () => {
      await expect(
        service.create({
          name: 'RustFS',
          vaultAdapterId: 's3',
          config: {
            endpoint: 'http://localhost:9000',
            bucket: 'orac',
            accessKeyId: 12345,
            secretAccessKey: 'secret',
          },
        }),
      ).rejects.toThrow('field_invalid:accessKeyId');
    });

    it('should throw NotFoundException for unknown vaultAdapterId', async () => {
      vaultAdapters.getAdapter.mockImplementation(() => {
        throw new NotFoundException('vault_adapter_not_found');
      });

      await expect(
        service.create({ name: 'Test', vaultAdapterId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for unknown vaultAdapterId', async () => {
      vaultAdapters.getAdapter.mockImplementation(() => {
        throw new NotFoundException('vault_adapter_not_found');
      });

      await expect(
        service.create({ name: 'Test', vaultAdapterId: 'nonexistent' }),
      ).rejects.toThrow('vault_adapter_not_found');
    });

    it('should strip dangerous config keys', async () => {
      prisma.vault.create.mockResolvedValue(mockVault);

      await service.create({
        name: 'RustFS',
        vaultAdapterId: 's3',
        config: {
          __proto__: { polluted: true },
          endpoint: 'http://localhost:9000',
          bucket: 'orac',
          accessKeyId: 'key',
          secretAccessKey: 'secret',
        } as Record<string, unknown>,
      });

      const calls = prisma.vault.create.mock.calls as [
        { data: { config: Record<string, unknown> } },
      ][];
      const createCall = calls[0][0];
      expect(
        Object.prototype.hasOwnProperty.call(
          createCall.data.config,
          '__proto__',
        ),
      ).toBe(false);
    });
  });

  describe('update', () => {
    it('should update vault name', async () => {
      prisma.vault.findUnique.mockResolvedValue(mockVault);
      prisma.vault.update.mockResolvedValue({ ...mockVault, name: 'Renamed' });

      const result = await service.update(mockVault.vaultId, {
        name: 'Renamed',
      });

      expect(result.name).toBe('Renamed');
      expect(prisma.vault.findUnique).toHaveBeenCalledWith({
        where: { vaultId: mockVault.vaultId },
      });
      expect(prisma.vault.update).toHaveBeenCalledWith({
        where: { vaultId: mockVault.vaultId },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ name: 'Renamed' }),
      });
    });

    it('should encrypt updated secure fields in config', async () => {
      prisma.vault.findUnique.mockResolvedValue(mockVault);
      prisma.vault.update.mockResolvedValue(mockVault);

      await service.update(mockVault.vaultId, {
        config: {
          endpoint: 'http://localhost:9000',
          bucket: 'orac',
          accessKeyId: 'new-key',
          secretAccessKey: 'new-secret',
        },
      });

      expect(encryption.encrypt).toHaveBeenCalledWith('new-key');
      expect(encryption.encrypt).toHaveBeenCalledWith('new-secret');
    });

    it('should throw NotFoundException when updating nonexistent vault', async () => {
      prisma.vault.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for nonexistent vault on update', async () => {
      prisma.vault.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'x' }),
      ).rejects.toThrow('vault_not_found');
    });
  });

  describe('remove', () => {
    it('should delete the vault', async () => {
      prisma.vault.findUnique.mockResolvedValue(mockVault);
      prisma.vault.delete.mockResolvedValue(mockVault);

      await service.remove(mockVault.vaultId);

      expect(prisma.vault.findUnique).toHaveBeenCalledWith({
        where: { vaultId: mockVault.vaultId },
      });
      expect(prisma.vault.delete).toHaveBeenCalledWith({
        where: { vaultId: mockVault.vaultId },
      });
    });

    it('should throw NotFoundException when deleting nonexistent vault', async () => {
      prisma.vault.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use snake_case error code', async () => {
      prisma.vault.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        'vault_not_found',
      );
    });
  });

  describe('getActiveVault', () => {
    it('should return hardcoded RustFS connection when workspace has no primaryVaultId', async () => {
      workspacesService.findPrimaryVaultId.mockResolvedValue(null);

      const result = await service.getActiveVault('workspace-1');

      expect(workspacesService.findPrimaryVaultId).toHaveBeenCalledWith(
        'workspace-1',
      );
      expect(result.adapter.vaultAdapterId).toBe('s3');
      expect(result.connection).toMatchObject({
        endpoint: 'http://orac.home.com:9000',
        bucket: 'orac',
        forcePathStyle: true,
      });
    });

    it('should return decrypted vault connection when workspace has primaryVaultId', async () => {
      workspacesService.findPrimaryVaultId.mockResolvedValue(mockVault.vaultId);
      prisma.vault.findUnique.mockResolvedValue(mockVault);

      const result = await service.getActiveVault('workspace-1');

      expect(prisma.vault.findUnique).toHaveBeenCalledWith({
        where: { vaultId: mockVault.vaultId },
      });
      expect(encryption.decrypt).toHaveBeenCalled();
      expect(result.adapter.vaultAdapterId).toBe('s3');
    });

    it('should throw NotFoundException when workspace not found', async () => {
      workspacesService.findPrimaryVaultId.mockRejectedValue(
        new NotFoundException('workspace_not_found'),
      );

      await expect(service.getActiveVault('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use snake_case error code for missing workspace', async () => {
      workspacesService.findPrimaryVaultId.mockRejectedValue(
        new NotFoundException('workspace_not_found'),
      );

      await expect(service.getActiveVault('nonexistent')).rejects.toThrow(
        'workspace_not_found',
      );
    });

    it('should throw NotFoundException when primary vault not found in DB', async () => {
      workspacesService.findPrimaryVaultId.mockResolvedValue('orphaned-id');
      prisma.vault.findUnique.mockResolvedValue(null);

      await expect(service.getActiveVault('workspace-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use snake_case error code for missing primary vault', async () => {
      workspacesService.findPrimaryVaultId.mockResolvedValue('orphaned-id');
      prisma.vault.findUnique.mockResolvedValue(null);

      await expect(service.getActiveVault('workspace-1')).rejects.toThrow(
        'vault_not_found',
      );
    });
  });
});
