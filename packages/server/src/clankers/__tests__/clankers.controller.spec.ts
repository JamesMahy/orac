import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClankersController } from '../clankers.controller';
import { ClankersService } from '../clankers.service';
import { CreateClankerDto } from '../clankers.dto';

const strippedClanker = {
  clankerId: '660e8400-e29b-41d4-a716-446655440000',
  name: 'Claude on prod',
  adapter: { adapterId: 'claude-code', name: 'Claude Code' },
  host: { hostId: '550e8400-e29b-41d4-a716-446655440000', name: 'Test Host' },
  config: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ClankersController', () => {
  let controller: ClankersController;
  let mockClankersService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockClankersService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClankersController],
      providers: [{ provide: ClankersService, useValue: mockClankersService }],
    }).compile();

    controller = module.get(ClankersController);
  });

  describe('GET /', () => {
    it('should call findAll and return result', async () => {
      mockClankersService.findAll.mockResolvedValue([strippedClanker]);

      const result = await controller.findAll();

      expect(mockClankersService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([strippedClanker]);
    });
  });

  describe('GET /:clankerId', () => {
    it('should call findOne with clankerId', async () => {
      mockClankersService.findOne.mockResolvedValue(strippedClanker);

      const result = await controller.findOne(strippedClanker.clankerId);

      expect(mockClankersService.findOne).toHaveBeenCalledWith(
        strippedClanker.clankerId,
      );
      expect(result).toEqual(strippedClanker);
    });

    it('should propagate NotFoundException from service', async () => {
      mockClankersService.findOne.mockRejectedValue(
        new NotFoundException('clanker_not_found'),
      );

      await expect(controller.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('POST /', () => {
    it('should call create with dto', async () => {
      const dto: CreateClankerDto = {
        name: 'Claude on prod',
        adapterId: 'claude-code',
        hostId: '550e8400-e29b-41d4-a716-446655440000',
      };
      mockClankersService.create.mockResolvedValue(strippedClanker);

      const result = await controller.create(dto);

      expect(mockClankersService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(strippedClanker);
    });
  });

  describe('PATCH /:clankerId', () => {
    it('should call update with clankerId and dto', async () => {
      const dto = { name: 'Updated Clanker' };
      mockClankersService.update.mockResolvedValue({
        ...strippedClanker,
        name: 'Updated Clanker',
      });

      const result = await controller.update(strippedClanker.clankerId, dto);

      expect(mockClankersService.update).toHaveBeenCalledWith(
        strippedClanker.clankerId,
        dto,
      );
      expect(result.name).toBe('Updated Clanker');
    });

    it('should propagate NotFoundException from service', async () => {
      mockClankersService.update.mockRejectedValue(
        new NotFoundException('clanker_not_found'),
      );

      await expect(
        controller.update('nonexistent', { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /:clankerId', () => {
    it('should call remove with clankerId', async () => {
      mockClankersService.remove.mockResolvedValue(undefined);

      await controller.remove(strippedClanker.clankerId);

      expect(mockClankersService.remove).toHaveBeenCalledWith(
        strippedClanker.clankerId,
      );
    });

    it('should propagate NotFoundException from service', async () => {
      mockClankersService.remove.mockRejectedValue(
        new NotFoundException('clanker_not_found'),
      );

      await expect(controller.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
