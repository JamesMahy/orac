import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdaptersController } from '../adapters.controller';
import { AdaptersService } from '../adapters.service';

const claudeCodeDefinition = {
  adapterId: 'claude-code',
  name: 'Claude Code',
  type: 'console' as const,
  command: 'claude',
  capabilities: ['filesystem', 'code_execution', 'tool_use', 'streaming'],
  commands: [
    { command: 'review', description: 'Review uncommitted code changes' },
    { command: 'init', description: 'Create a CLAUDE.md project configuration' },
    { command: 'bug', description: 'Report an issue to Anthropic' },
  ],
  fields: [],
  defaultEndpoint: null,
  sessionStrategy: 'managed' as const,
};

describe('AdaptersController', () => {
  let controller: AdaptersController;
  let mockAdaptersService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockAdaptersService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      getAdapter: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdaptersController],
      providers: [{ provide: AdaptersService, useValue: mockAdaptersService }],
    }).compile();

    controller = module.get(AdaptersController);
  });

  describe('GET /adapters', () => {
    it('should return all adapter definitions', () => {
      mockAdaptersService.findAll.mockReturnValue([claudeCodeDefinition]);

      const result = controller.findAll();

      expect(mockAdaptersService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([claudeCodeDefinition]);
    });
  });

  describe('GET /adapters/:adapterId', () => {
    it('should return a single adapter definition', () => {
      mockAdaptersService.findOne.mockReturnValue(claudeCodeDefinition);

      const result = controller.findOne('claude-code');

      expect(mockAdaptersService.findOne).toHaveBeenCalledWith('claude-code');
      expect(result).toEqual(claudeCodeDefinition);
    });

    it('should propagate NotFoundException from service', () => {
      mockAdaptersService.findOne.mockImplementation(() => {
        throw new NotFoundException('adapter_not_found');
      });

      expect(() => controller.findOne('nonexistent')).toThrow(
        NotFoundException,
      );
    });
  });
});
