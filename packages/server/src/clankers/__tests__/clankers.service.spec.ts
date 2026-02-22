import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClankersService } from '../clankers.service';
import { PrismaService } from '@database/prisma.service';
import { EncryptionService } from '@common/crypto/encryption.service';
import { ClankerAdaptersService } from '@clankers/clankerAdapters.service';

const mockConsoleAdapter = {
  clankerAdapterId: 'claude-code',
  name: 'Claude Code',
  type: 'console' as const,
  fields: [],
  capabilities: [],
  commands: [],
  sessionStrategy: 'managed' as const,
  command: 'claude',
  defaultEndpoint: null,
  toDefinition: jest.fn(),
  sendMessage: jest.fn(),
  handleCommand: jest.fn(),
  listModels: jest.fn(),
};

const mockApiAdapter = {
  clankerAdapterId: 'openai-api',
  name: 'OpenAI API',
  type: 'api' as const,
  fields: [
    {
      key: 'apiKey',
      label: 'API Key',
      type: 'text' as const,
      required: true,
      secure: true,
    },
    { key: 'model', label: 'Model', type: 'text' as const, required: true },
    {
      key: 'temperature',
      label: 'Temperature',
      type: 'number' as const,
      required: false,
      min: 0,
      max: 2,
    },
  ],
  capabilities: [],
  commands: [],
  sessionStrategy: 'unmanaged' as const,
  command: null,
  defaultEndpoint: 'https://api.openai.com/v1',
  toDefinition: jest.fn(),
  sendMessage: jest.fn(),
  handleCommand: jest.fn(),
  listModels: jest.fn(),
};

const mockHost = {
  hostId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Host',
  type: 'ssh',
  hostname: '192.168.1.1',
  port: 22,
  username: 'root',
  password: null,
  hostKeyFingerprint: null,
  endpoint: null,
  apiKey: null,
  provider: null,
  model: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockConsoleClanker = {
  clankerId: '660e8400-e29b-41d4-a716-446655440000',
  name: 'Claude on prod',
  clankerAdapterId: 'claude-code',
  hostId: mockHost.hostId,
  host: mockHost,
  config: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockApiClanker = {
  clankerId: '660e8400-e29b-41d4-a716-446655440001',
  name: 'OpenAI GPT-4',
  clankerAdapterId: 'openai-api',
  hostId: null,
  host: null,
  config: { apiKey: 'encrypted_key', model: 'gpt-4' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ClankersService', () => {
  let service: ClankersService;
  let prisma: {
    clanker: Record<string, jest.Mock>;
    host: Record<string, jest.Mock>;
  };
  let encryption: { encrypt: jest.Mock };
  let adaptersService: { getAdapter: jest.Mock };

  beforeEach(async () => {
    prisma = {
      clanker: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      host: {
        findUnique: jest.fn(),
      },
    };

    encryption = {
      encrypt: jest.fn().mockReturnValue('encrypted_value'),
    };

    adaptersService = {
      getAdapter: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClankersService,
        { provide: PrismaService, useValue: prisma },
        { provide: EncryptionService, useValue: encryption },
        { provide: ClankerAdaptersService, useValue: adaptersService },
      ],
    }).compile();

    service = module.get(ClankersService);
  });

  describe('findAll', () => {
    it('should return stripped clankers ordered by createdAt desc', async () => {
      prisma.clanker.findMany.mockResolvedValue([
        mockConsoleClanker,
        mockApiClanker,
      ]);
      adaptersService.getAdapter
        .mockReturnValueOnce(mockConsoleAdapter)
        .mockReturnValueOnce(mockApiAdapter);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(prisma.clanker.findMany).toHaveBeenCalledWith({
        include: { host: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result[0].name).toBe('Claude on prod');
      expect(result[1].name).toBe('OpenAI GPT-4');
      // Secure fields should be stripped
      expect(result[1].config.apiKey).toBe(true);
      expect(result[1].config.model).toBe('gpt-4');
    });

    it('should return empty array when no clankers exist', async () => {
      prisma.clanker.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a stripped clanker', async () => {
      prisma.clanker.findUnique.mockResolvedValue(mockApiClanker);
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);

      const result = await service.findOne(mockApiClanker.clankerId);

      expect(result.name).toBe('OpenAI GPT-4');
      expect(result.config.apiKey).toBe(true);
      expect(result.config.model).toBe('gpt-4');
      expect(prisma.clanker.findUnique).toHaveBeenCalledWith({
        where: { clankerId: mockApiClanker.clankerId },
        include: { host: true },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.clanker.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use snake_case error code', async () => {
      prisma.clanker.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'clanker_not_found',
      );
    });
  });

  describe('create', () => {
    it('should create a console clanker with hostId', async () => {
      adaptersService.getAdapter.mockReturnValue(mockConsoleAdapter);
      prisma.host.findUnique.mockResolvedValue(mockHost);
      prisma.clanker.create.mockResolvedValue(mockConsoleClanker);

      const result = await service.create({
        name: 'Claude on prod',
        clankerAdapterId: 'claude-code',
        hostId: mockHost.hostId,
      });

      expect(result.name).toBe('Claude on prod');
      expect(prisma.clanker.create).toHaveBeenCalledWith({
        data: {
          name: 'Claude on prod',
          clankerAdapterId: 'claude-code',
          hostId: mockHost.hostId,
          config: {},
        },
        include: { host: true },
      });
    });

    it('should throw BadRequestException for console clanker without hostId', async () => {
      adaptersService.getAdapter.mockReturnValue(mockConsoleAdapter);

      await expect(
        service.create({
          name: 'Claude',
          clankerAdapterId: 'claude-code',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use snake_case error code for missing hostId', async () => {
      adaptersService.getAdapter.mockReturnValue(mockConsoleAdapter);

      await expect(
        service.create({
          name: 'Claude',
          clankerAdapterId: 'claude-code',
        }),
      ).rejects.toThrow('host_id_required');
    });

    it('should throw NotFoundException for console clanker with invalid hostId', async () => {
      adaptersService.getAdapter.mockReturnValue(mockConsoleAdapter);
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Claude',
          clankerAdapterId: 'claude-code',
          hostId: 'nonexistent-uuid',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for missing host', async () => {
      adaptersService.getAdapter.mockReturnValue(mockConsoleAdapter);
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Claude',
          clankerAdapterId: 'claude-code',
          hostId: 'nonexistent-uuid',
        }),
      ).rejects.toThrow('host_not_found');
    });

    it('should create an API clanker with encrypted secure fields', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);
      prisma.clanker.create.mockResolvedValue(mockApiClanker);

      await service.create({
        name: 'OpenAI GPT-4',
        clankerAdapterId: 'openai-api',
        config: { apiKey: 'sk-test', model: 'gpt-4' },
      });

      expect(encryption.encrypt).toHaveBeenCalledWith('sk-test');
      expect(prisma.clanker.create).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          config: expect.objectContaining({
            apiKey: 'encrypted_value',
            model: 'gpt-4',
          }),
        }),
        include: { host: true },
      });
    });

    it('should throw BadRequestException for missing required config field', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);

      await expect(
        service.create({
          name: 'OpenAI',
          clankerAdapterId: 'openai-api',
          config: { apiKey: 'sk-test' },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use snake_case error code for missing required config field', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);

      await expect(
        service.create({
          name: 'OpenAI',
          clankerAdapterId: 'openai-api',
          config: { apiKey: 'sk-test' },
        }),
      ).rejects.toThrow('field_required:model');
    });

    it('should throw adapter_not_found for invalid clankerAdapterId', async () => {
      adaptersService.getAdapter.mockImplementation(() => {
        throw new NotFoundException('adapter_not_found');
      });

      await expect(
        service.create({
          name: 'Test',
          clankerAdapterId: 'nonexistent',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for number field above max', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);

      await expect(
        service.create({
          name: 'OpenAI',
          clankerAdapterId: 'openai-api',
          config: { apiKey: 'sk-test', model: 'gpt-4', temperature: 5 },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use snake_case error code for invalid number field', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);

      await expect(
        service.create({
          name: 'OpenAI',
          clankerAdapterId: 'openai-api',
          config: { apiKey: 'sk-test', model: 'gpt-4', temperature: 5 },
        }),
      ).rejects.toThrow('field_invalid:temperature');
    });

    it('should reject NaN values for number fields', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);

      await expect(
        service.create({
          name: 'OpenAI',
          clankerAdapterId: 'openai-api',
          config: {
            apiKey: 'sk-test',
            model: 'gpt-4',
            temperature: 'not-a-number',
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use snake_case error code for NaN number field', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);

      await expect(
        service.create({
          name: 'OpenAI',
          clankerAdapterId: 'openai-api',
          config: {
            apiKey: 'sk-test',
            model: 'gpt-4',
            temperature: 'not-a-number',
          },
        }),
      ).rejects.toThrow('field_invalid:temperature');
    });

    it('should accept number fields at exact boundary values', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);
      prisma.clanker.create.mockResolvedValue(mockApiClanker);

      await service.create({
        name: 'OpenAI',
        clankerAdapterId: 'openai-api',
        config: { apiKey: 'sk-test', model: 'gpt-4', temperature: 0 },
      });

      expect(prisma.clanker.create).toHaveBeenCalled();
    });

    it('should reject number fields below minimum', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);

      await expect(
        service.create({
          name: 'OpenAI',
          clankerAdapterId: 'openai-api',
          config: { apiKey: 'sk-test', model: 'gpt-4', temperature: -1 },
        }),
      ).rejects.toThrow('field_invalid:temperature');
    });

    it('should throw BadRequestException when no config provided and adapter has required fields', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);

      await expect(
        service.create({
          name: 'OpenAI',
          clankerAdapterId: 'openai-api',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use snake_case error code when required field missing from empty config', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);

      await expect(
        service.create({
          name: 'OpenAI',
          clankerAdapterId: 'openai-api',
        }),
      ).rejects.toThrow('field_required:apiKey');
    });
  });

  describe('update', () => {
    it('should update clanker name', async () => {
      prisma.clanker.findUnique.mockResolvedValue(mockConsoleClanker);
      adaptersService.getAdapter.mockReturnValue(mockConsoleAdapter);
      prisma.clanker.update.mockResolvedValue({
        ...mockConsoleClanker,
        name: 'Renamed',
        host: mockHost,
      });

      const result = await service.update(mockConsoleClanker.clankerId, {
        name: 'Renamed',
      });

      expect(result.name).toBe('Renamed');
      expect(prisma.clanker.update).toHaveBeenCalledWith({
        where: { clankerId: mockConsoleClanker.clankerId },
        data: expect.objectContaining({ name: 'Renamed' }),
        include: { host: true },
      });
    });

    it('should encrypt updated secure fields in config', async () => {
      prisma.clanker.findUnique.mockResolvedValue(mockApiClanker);
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);
      prisma.clanker.update.mockResolvedValue({
        ...mockApiClanker,
        config: { apiKey: 'new_encrypted', model: 'gpt-4' },
        host: null,
      });

      await service.update(mockApiClanker.clankerId, {
        config: { apiKey: 'new-key', model: 'gpt-4' },
      });

      expect(encryption.encrypt).toHaveBeenCalledWith('new-key');
    });

    it('should throw NotFoundException for invalid hostId on console adapter', async () => {
      prisma.clanker.findUnique.mockResolvedValue(mockConsoleClanker);
      adaptersService.getAdapter.mockReturnValue(mockConsoleAdapter);
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockConsoleClanker.clankerId, {
          hostId: 'nonexistent-uuid',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for missing host on update', async () => {
      prisma.clanker.findUnique.mockResolvedValue(mockConsoleClanker);
      adaptersService.getAdapter.mockReturnValue(mockConsoleAdapter);
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockConsoleClanker.clankerId, {
          hostId: 'nonexistent-uuid',
        }),
      ).rejects.toThrow('host_not_found');
    });

    it('should use existing clankerAdapterId when dto does not provide one', async () => {
      prisma.clanker.findUnique.mockResolvedValue(mockApiClanker);
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);
      prisma.clanker.update.mockResolvedValue(mockApiClanker);

      await service.update(mockApiClanker.clankerId, {
        config: { apiKey: 'sk-new', model: 'gpt-4' },
      });

      expect(adaptersService.getAdapter).toHaveBeenCalledWith('openai-api');
    });

    it('should throw NotFoundException when updating nonexistent clanker', async () => {
      prisma.clanker.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for nonexistent clanker on update', async () => {
      prisma.clanker.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'x' }),
      ).rejects.toThrow('clanker_not_found');
    });
  });

  describe('remove', () => {
    it('should delete the clanker', async () => {
      prisma.clanker.findUnique.mockResolvedValue(mockConsoleClanker);
      prisma.clanker.delete.mockResolvedValue(mockConsoleClanker);

      await service.remove(mockConsoleClanker.clankerId);

      expect(prisma.clanker.delete).toHaveBeenCalledWith({
        where: { clankerId: mockConsoleClanker.clankerId },
      });
    });

    it('should throw NotFoundException when deleting nonexistent clanker', async () => {
      prisma.clanker.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use snake_case error code', async () => {
      prisma.clanker.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        'clanker_not_found',
      );
    });
  });

  describe('sanitizeConfig', () => {
    it('should strip __proto__, constructor, and prototype keys from config', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);
      prisma.clanker.create.mockResolvedValue(mockApiClanker);

      await service.create({
        name: 'OpenAI',
        clankerAdapterId: 'openai-api',
        config: {
          __proto__: { polluted: true },
          constructor: { polluted: true },
          prototype: { polluted: true },
          apiKey: 'sk-test',
          model: 'gpt-4',
        } as Record<string, unknown>,
      });

      // Dangerous keys should not appear in the stored config
      const createCall = prisma.clanker.create.mock.calls[0][0] as {
        data: { config: Record<string, unknown> };
      };
      expect(
        Object.prototype.hasOwnProperty.call(
          createCall.data.config,
          'constructor',
        ),
      ).toBe(false);
      expect(
        Object.prototype.hasOwnProperty.call(
          createCall.data.config,
          'prototype',
        ),
      ).toBe(false);
    });

    it('should strip dangerous keys during update', async () => {
      prisma.clanker.findUnique.mockResolvedValue(mockApiClanker);
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);
      prisma.clanker.update.mockResolvedValue(mockApiClanker);

      await service.update(mockApiClanker.clankerId, {
        config: {
          __proto__: { polluted: true },
          apiKey: 'sk-new',
          model: 'gpt-4',
        } as Record<string, unknown>,
      });

      const updateCall = prisma.clanker.update.mock.calls[0][0] as {
        data: { config: Record<string, unknown> };
      };
      expect(
        Object.prototype.hasOwnProperty.call(
          updateCall.data.config,
          '__proto__',
        ),
      ).toBe(false);
    });
  });

  describe('secure field type validation', () => {
    it('should reject non-string secure field values', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);

      await expect(
        service.create({
          name: 'OpenAI',
          clankerAdapterId: 'openai-api',
          config: { apiKey: 12345, model: 'gpt-4' },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use snake_case error code for non-string secure field', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);

      await expect(
        service.create({
          name: 'OpenAI',
          clankerAdapterId: 'openai-api',
          config: { apiKey: 12345, model: 'gpt-4' },
        }),
      ).rejects.toThrow('field_invalid:apiKey');
    });

    it('should reject array secure field values', async () => {
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);

      await expect(
        service.create({
          name: 'OpenAI',
          clankerAdapterId: 'openai-api',
          config: { apiKey: ['part1', 'part2'], model: 'gpt-4' },
        }),
      ).rejects.toThrow('field_invalid:apiKey');
    });
  });

  describe('stripConfig', () => {
    it('should replace secure fields with true and leave others untouched', async () => {
      prisma.clanker.findUnique.mockResolvedValue(mockApiClanker);
      adaptersService.getAdapter.mockReturnValue(mockApiAdapter);

      const result = await service.findOne(mockApiClanker.clankerId);

      expect(result.config.apiKey).toBe(true);
      expect(result.config.model).toBe('gpt-4');
    });

    it('should not strip anything for adapters with no secure fields', async () => {
      prisma.clanker.findUnique.mockResolvedValue(mockConsoleClanker);
      adaptersService.getAdapter.mockReturnValue(mockConsoleAdapter);

      const result = await service.findOne(mockConsoleClanker.clankerId);

      expect(result.config).toEqual({});
    });
  });
});
