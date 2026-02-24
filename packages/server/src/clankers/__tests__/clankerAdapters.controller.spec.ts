import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClankerAdaptersController } from '../clankerAdapters.controller';
import { ClankerAdaptersService } from '../clankerAdapters.service';

const claudeCodeDefinition = {
  clankerAdapterId: 'claude-code',
  name: 'Claude Code',
  type: 'console' as const,
  command: 'claude',
  capabilities: ['filesystem', 'code_execution', 'tool_use', 'streaming'],
  commands: [
    { command: 'review', description: 'Review uncommitted code changes' },
    {
      command: 'init',
      description: 'Create a CLAUDE.md project configuration',
    },
    { command: 'bug', description: 'Report an issue to Anthropic' },
  ],
  fields: [],
  defaultEndpoint: null,
  sessionStrategy: 'managed' as const,
};

describe('ClankerAdaptersController', () => {
  let controller: ClankerAdaptersController;
  let mockClankerAdaptersService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockClankerAdaptersService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      getAdapter: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClankerAdaptersController],
      providers: [
        {
          provide: ClankerAdaptersService,
          useValue: mockClankerAdaptersService,
        },
      ],
    }).compile();

    controller = module.get(ClankerAdaptersController);
  });

  describe('GET /clanker-adapters', () => {
    it('should return all adapter definitions', () => {
      mockClankerAdaptersService.findAll.mockReturnValue([
        claudeCodeDefinition,
      ]);

      const result = controller.findAll();

      expect(mockClankerAdaptersService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([claudeCodeDefinition]);
    });
  });

  describe('GET /clanker-adapters/:clankerAdapterId', () => {
    it('should return a single adapter definition', () => {
      mockClankerAdaptersService.findOne.mockReturnValue(claudeCodeDefinition);

      const result = controller.findOne('claude-code');

      expect(mockClankerAdaptersService.findOne).toHaveBeenCalledWith(
        'claude-code',
      );
      expect(result).toEqual(claudeCodeDefinition);
    });

    it('should propagate NotFoundException from service', () => {
      mockClankerAdaptersService.findOne.mockImplementation(() => {
        throw new NotFoundException('adapter_not_found');
      });

      expect(() => controller.findOne('nonexistent')).toThrow(
        NotFoundException,
      );
    });
  });
});
