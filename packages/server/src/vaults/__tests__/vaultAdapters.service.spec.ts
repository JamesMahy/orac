import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VaultAdaptersService } from '../vaultAdapters.service';

describe('VaultAdaptersService', () => {
  let service: VaultAdaptersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VaultAdaptersService],
    }).compile();

    service = module.get<VaultAdaptersService>(VaultAdaptersService);
  });

  describe('findAll', () => {
    it('should return all registered adapters', () => {
      const result = service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].vaultAdapterId).toBe('s3');
    });
  });

  describe('findOne', () => {
    it('should return the s3 adapter definition', () => {
      const result = service.findOne('s3');

      expect(result).toEqual({
        vaultAdapterId: 's3',
        name: 'S3 Compatible',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        fields: expect.arrayContaining([
          expect.objectContaining({ key: 'endpoint', required: true }),
          expect.objectContaining({ key: 'bucket', required: true }),
          expect.objectContaining({
            key: 'accessKeyId',
            required: true,
            secure: true,
          }),
          expect.objectContaining({
            key: 'secretAccessKey',
            required: true,
            secure: true,
          }),
        ]),
      });
    });

    it('should throw NotFoundException for unknown adapter', () => {
      expect(() => service.findOne('nonexistent')).toThrow(NotFoundException);
    });

    it('should throw with snake_case error code', () => {
      expect(() => service.findOne('nonexistent')).toThrow(
        'vault_adapter_not_found',
      );
    });
  });

  describe('getAdapter', () => {
    it('should return the adapter instance', () => {
      const adapter = service.getAdapter('s3');

      expect(adapter.vaultAdapterId).toBe('s3');
      expect(adapter.name).toBe('S3 Compatible');
    });

    it('should throw NotFoundException for unknown adapter', () => {
      expect(() => service.getAdapter('nonexistent')).toThrow(
        NotFoundException,
      );
    });

    it('should throw with snake_case error code', () => {
      expect(() => service.getAdapter('nonexistent')).toThrow(
        'vault_adapter_not_found',
      );
    });
  });
});
