import { Test, TestingModule } from '@nestjs/testing';
import { VaultsController } from '../vaults.controller';
import { VaultAdaptersService } from '../vaultAdapters.service';
import { VaultsService } from '../vaults.service';

const s3Definition = {
  vaultAdapterId: 's3',
  name: 'S3 Compatible',
  fields: [
    { key: 'endpoint', label: 'Endpoint URL', type: 'text', required: true },
    { key: 'bucket', label: 'Bucket', type: 'text', required: true },
  ],
};

const mockVault = {
  vaultId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Primary RustFS',
  vaultAdapterId: 's3',
  config: { endpoint: 'http://localhost:9000', bucket: 'orac' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('VaultsController', () => {
  let controller: VaultsController;
  let mockVaultAdapters: Record<string, jest.Mock>;
  let mockVaults: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockVaultAdapters = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      getAdapter: jest.fn(),
    };

    mockVaults = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getActiveVault: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VaultsController],
      providers: [
        { provide: VaultAdaptersService, useValue: mockVaultAdapters },
        { provide: VaultsService, useValue: mockVaults },
      ],
    }).compile();

    controller = module.get<VaultsController>(VaultsController);
  });

  describe('GET /vault-adapters', () => {
    it('should return all vault adapter definitions', () => {
      mockVaultAdapters.findAll.mockReturnValue([s3Definition]);

      const result = controller.findAllAdapters();

      expect(mockVaultAdapters.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([s3Definition]);
    });
  });

  describe('GET /vaults', () => {
    it('should return all vaults', async () => {
      mockVaults.findAll.mockResolvedValue([mockVault]);

      const result = await controller.findAllVaults();

      expect(mockVaults.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockVault]);
    });
  });
});
