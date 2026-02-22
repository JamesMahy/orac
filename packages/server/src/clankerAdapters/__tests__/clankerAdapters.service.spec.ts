import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClankerAdaptersService } from '../clankerAdapters.service';

describe('ClankerAdaptersService', () => {
  let service: ClankerAdaptersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClankerAdaptersService],
    }).compile();

    service = module.get(ClankerAdaptersService);
  });

  describe('findAll', () => {
    it('should return all registered adapters', () => {
      const result = service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].clankerAdapterId).toBe('claude-code');
    });
  });

  describe('findOne', () => {
    it('should return the claude-code adapter definition', () => {
      const result = service.findOne('claude-code');

      expect(result).toEqual({
        clankerAdapterId: 'claude-code',
        name: 'Claude Code',
        type: 'console',
        command: 'claude',
        capabilities: ['filesystem', 'code_execution', 'tool_use', 'streaming'],
        commands: expect.arrayContaining([
          expect.objectContaining({ command: 'init' }),
          expect.objectContaining({ command: 'review' }),
          expect.objectContaining({ command: 'compact' }),
          expect.objectContaining({ command: 'bug' }),
          expect.objectContaining({ command: 'plan' }),
          expect.objectContaining({ command: 'model' }),
        ]),
        fields: [],
        defaultEndpoint: null,
        sessionStrategy: 'managed',
      });
    });

    it('should throw NotFoundException for nonexistent adapter', () => {
      expect(() => service.findOne('nonexistent')).toThrow(NotFoundException);
    });

    it('should throw with snake_case error code', () => {
      expect(() => service.findOne('nonexistent')).toThrow('adapter_not_found');
    });
  });

  describe('getAdapter', () => {
    it('should return the adapter instance', () => {
      const adapter = service.getAdapter('claude-code');

      expect(adapter.clankerAdapterId).toBe('claude-code');
      expect(adapter.name).toBe('Claude Code');
      expect(adapter.command).toBe('claude');
    });

    it('should throw NotFoundException for nonexistent adapter', () => {
      expect(() => service.getAdapter('nonexistent')).toThrow(NotFoundException);
    });
  });
});
