import { Test, TestingModule } from '@nestjs/testing';
import { FileService } from '../file.service';
import { VaultsService } from '@vaults/vaults.service';

describe('FileService', () => {
  let service: FileService;
  let mockAdapter: {
    upload: jest.Mock;
    download: jest.Mock;
    delete: jest.Mock;
  };
  let mockVaults: { getActiveVault: jest.Mock };

  beforeEach(async () => {
    mockAdapter = {
      upload: jest.fn().mockResolvedValue(undefined),
      download: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockVaults = {
      getActiveVault: jest.fn().mockResolvedValue({
        adapter: mockAdapter,
        connection: {
          endpoint: 'http://localhost:9000',
          bucket: 'orac',
          accessKeyId: 'key',
          secretAccessKey: 'secret',
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        { provide: VaultsService, useValue: mockVaults },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  describe('upload', () => {
    it('should generate a storage key and call adapter.upload', async () => {
      const data = Buffer.from('hello');
      const key = await service.upload(
        'workspace-1',
        'file.txt',
        data,
        'text/plain',
      );

      expect(key).toMatch(/^workspace-1\/.+\/file\.txt$/);
      expect(mockVaults.getActiveVault).toHaveBeenCalledWith('workspace-1');
      expect(mockAdapter.upload).toHaveBeenCalledWith(
        expect.any(Object),
        key,
        data,
        'text/plain',
      );
    });

    it('should use uuid in the storage key', async () => {
      const key1 = await service.upload(
        'ws',
        'img.png',
        Buffer.from('a'),
        'image/png',
      );
      const key2 = await service.upload(
        'ws',
        'img.png',
        Buffer.from('b'),
        'image/png',
      );

      expect(key1).not.toBe(key2);
    });
  });

  describe('download', () => {
    it('should call adapter.download and return the buffer', async () => {
      const buffer = Buffer.from('content');
      mockAdapter.download.mockResolvedValue(buffer);

      const result = await service.download(
        'workspace-1/uuid/file.txt',
        'workspace-1',
      );

      expect(mockVaults.getActiveVault).toHaveBeenCalledWith('workspace-1');
      expect(mockAdapter.download).toHaveBeenCalledWith(
        expect.any(Object),
        'workspace-1/uuid/file.txt',
      );
      expect(result).toBe(buffer);
    });
  });

  describe('remove', () => {
    it('should call adapter.delete', async () => {
      await service.remove('workspace-1/uuid/file.txt', 'workspace-1');

      expect(mockVaults.getActiveVault).toHaveBeenCalledWith('workspace-1');
      expect(mockAdapter.delete).toHaveBeenCalledWith(
        expect.any(Object),
        'workspace-1/uuid/file.txt',
      );
    });
  });
});
