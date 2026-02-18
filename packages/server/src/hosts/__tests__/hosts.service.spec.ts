import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HostsService } from '../hosts.service';
import { PrismaService } from '@database/prisma.service';
import { EncryptionService } from '@common/crypto/encryption.service';

const mockHost = {
  hostId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test SSH Host',
  type: 'ssh',
  hostname: '192.168.1.1',
  port: 22,
  username: 'root',
  password: 'encrypted_pw',
  endpoint: null,
  apiKey: null,
  provider: null,
  model: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockApiHost = {
  ...mockHost,
  hostId: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Test API Host',
  type: 'api',
  hostname: null,
  port: null,
  username: null,
  password: null,
  endpoint: 'https://api.openai.com/v1',
  apiKey: 'encrypted_key',
  provider: 'openai',
  model: 'gpt-4',
};

const mockBothSensitive = {
  ...mockHost,
  hostId: '550e8400-e29b-41d4-a716-446655440002',
  name: 'Both Sensitive',
  password: 'enc_pw',
  apiKey: 'enc_key',
};

describe('HostsService', () => {
  let service: HostsService;
  let prisma: { host: Record<string, jest.Mock> };
  let encryption: { encrypt: jest.Mock };

  beforeEach(async () => {
    prisma = {
      host: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    encryption = {
      encrypt: jest.fn().mockReturnValue('encrypted_value'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HostsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EncryptionService, useValue: encryption },
      ],
    }).compile();

    service = module.get(HostsService);
  });

  describe('findAll', () => {
    it('should return hosts with password/apiKey stripped', async () => {
      prisma.host.findMany.mockResolvedValue([mockHost, mockApiHost]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0]).not.toHaveProperty('apiKey');
      expect(result[0]).toHaveProperty('hostId', mockHost.hostId);
      expect(result[1]).not.toHaveProperty('password');
      expect(result[1]).not.toHaveProperty('apiKey');
      expect(result[1]).toHaveProperty('hostId', mockApiHost.hostId);
      expect(result[0]).toHaveProperty('name', 'Test SSH Host');
      expect(prisma.host.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no hosts exist', async () => {
      prisma.host.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a host with sensitive fields stripped', async () => {
      prisma.host.findUnique.mockResolvedValue(mockHost);

      const result = await service.findOne(mockHost.hostId);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('apiKey');
      expect(result).toHaveProperty('hostId', mockHost.hostId);
      expect(result).toHaveProperty('name', 'Test SSH Host');
      expect(prisma.host.findUnique).toHaveBeenCalledWith({
        where: { hostId: mockHost.hostId },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException with snake_case error code', async () => {
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'host_not_found',
      );
    });
  });

  describe('create', () => {
    it('should encrypt password for SSH host', async () => {
      prisma.host.create.mockResolvedValue(mockHost);

      await service.create({
        name: 'Test SSH Host',
        type: 'ssh',
        hostname: '192.168.1.1',
        port: 22,
        username: 'root',
        password: 'secret',
      });

      expect(encryption.encrypt).toHaveBeenCalledWith('secret');
      expect(prisma.host.create).toHaveBeenCalledWith(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { data: expect.objectContaining({ password: 'encrypted_value' }) },
      );
    });

    it('should encrypt apiKey for API host', async () => {
      prisma.host.create.mockResolvedValue(mockApiHost);

      await service.create({
        name: 'Test API Host',
        type: 'api',
        endpoint: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        provider: 'openai',
        model: 'gpt-4',
      });

      expect(encryption.encrypt).toHaveBeenCalledWith('sk-test');
      expect(prisma.host.create).toHaveBeenCalledWith(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { data: expect.objectContaining({ apiKey: 'encrypted_value' }) },
      );
    });

    it('should not encrypt apiKey when creating SSH host', async () => {
      prisma.host.create.mockResolvedValue(mockHost);

      await service.create({
        name: 'Test SSH Host',
        type: 'ssh',
        hostname: '192.168.1.1',
        username: 'root',
        password: 'secret',
      });

      expect(encryption.encrypt).toHaveBeenCalledTimes(1);
      expect(encryption.encrypt).toHaveBeenCalledWith('secret');
    });

    it('should not encrypt password when creating API host', async () => {
      prisma.host.create.mockResolvedValue(mockApiHost);

      await service.create({
        name: 'Test API Host',
        type: 'api',
        endpoint: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        provider: 'openai',
        model: 'gpt-4',
      });

      expect(encryption.encrypt).toHaveBeenCalledTimes(1);
      expect(encryption.encrypt).toHaveBeenCalledWith('sk-test');
    });
  });

  describe('update', () => {
    it('should encrypt password when provided', async () => {
      prisma.host.findUnique.mockResolvedValue(mockHost);
      prisma.host.update.mockResolvedValue(mockHost);

      await service.update(mockHost.hostId, { password: 'new-secret' });

      expect(encryption.encrypt).toHaveBeenCalledWith('new-secret');
      expect(prisma.host.update).toHaveBeenCalledWith({
        where: { hostId: mockHost.hostId },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ password: 'encrypted_value' }),
      });
    });

    it('should encrypt apiKey when provided', async () => {
      prisma.host.findUnique.mockResolvedValue(mockApiHost);
      prisma.host.update.mockResolvedValue(mockApiHost);

      await service.update(mockApiHost.hostId, { apiKey: 'new-key' });

      expect(encryption.encrypt).toHaveBeenCalledWith('new-key');
      expect(prisma.host.update).toHaveBeenCalledWith({
        where: { hostId: mockApiHost.hostId },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ apiKey: 'encrypted_value' }),
      });
    });

    it('should not call encrypt when updating non-sensitive fields', async () => {
      prisma.host.findUnique.mockResolvedValue(mockHost);
      prisma.host.update.mockResolvedValue({
        ...mockHost,
        name: 'Renamed',
      });

      await service.update(mockHost.hostId, { name: 'Renamed' });

      expect(encryption.encrypt).not.toHaveBeenCalled();
      expect(prisma.host.update).toHaveBeenCalledWith({
        where: { hostId: mockHost.hostId },
        data: { name: 'Renamed' },
      });
    });

    it('should set password to null when empty string is provided', async () => {
      prisma.host.findUnique.mockResolvedValue(mockHost);
      prisma.host.update.mockResolvedValue({
        ...mockHost,
        password: null,
      });

      await service.update(mockHost.hostId, { password: '' });

      expect(encryption.encrypt).not.toHaveBeenCalled();
      expect(prisma.host.update).toHaveBeenCalledWith({
        where: { hostId: mockHost.hostId },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ password: null }),
      });
    });

    it('should throw NotFoundException when host not found', async () => {
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the host', async () => {
      prisma.host.findUnique.mockResolvedValue(mockHost);
      prisma.host.delete.mockResolvedValue(mockHost);

      await service.remove(mockHost.hostId);

      expect(prisma.host.delete).toHaveBeenCalledWith({
        where: { hostId: mockHost.hostId },
      });
    });

    it('should throw NotFoundException when host not found', async () => {
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toResponse', () => {
    it('should strip both password and apiKey when both are present', async () => {
      prisma.host.findUnique.mockResolvedValue(mockBothSensitive);

      const result = await service.findOne(mockBothSensitive.hostId);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('apiKey');
      expect(result).toHaveProperty('hostId', mockBothSensitive.hostId);
      expect(result).toHaveProperty('name', 'Both Sensitive');
      expect(result).toHaveProperty('hostname');
    });

    it('should set hasPassword to true when password exists', async () => {
      prisma.host.findUnique.mockResolvedValue(mockHost);

      const result = await service.findOne(mockHost.hostId);

      expect(result.hasPassword).toBe(true);
    });

    it('should set hasPassword to false when password is null', async () => {
      prisma.host.findUnique.mockResolvedValue({
        ...mockHost,
        password: null,
      });

      const result = await service.findOne(mockHost.hostId);

      expect(result.hasPassword).toBe(false);
    });
  });
});
