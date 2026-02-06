import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HostsController } from '../hosts.controller';
import { HostsService } from '../hosts.service';
import { CreateHostDto } from '../hosts.dto';

const strippedHost = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test SSH Host',
  type: 'ssh',
  hostname: '192.168.1.1',
  port: 22,
  username: 'root',
  endpoint: null,
  provider: null,
  model: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('HostsController', () => {
  let controller: HostsController;
  let mockHostsService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockHostsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HostsController],
      providers: [{ provide: HostsService, useValue: mockHostsService }],
    }).compile();

    controller = module.get(HostsController);
  });

  describe('GET /', () => {
    it('should call findAll and return result', async () => {
      mockHostsService.findAll.mockResolvedValue([strippedHost]);

      const result = await controller.findAll();

      expect(mockHostsService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([strippedHost]);
    });
  });

  describe('GET /:id', () => {
    it('should call findOne with id', async () => {
      mockHostsService.findOne.mockResolvedValue(strippedHost);

      const result = await controller.findOne(strippedHost.id);

      expect(mockHostsService.findOne).toHaveBeenCalledWith(strippedHost.id);
      expect(result).toEqual(strippedHost);
    });

    it('should propagate NotFoundException from service', async () => {
      mockHostsService.findOne.mockRejectedValue(
        new NotFoundException('Host not found'),
      );

      await expect(controller.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('POST /', () => {
    it('should call create with dto', async () => {
      const dto: CreateHostDto = {
        name: 'Test SSH Host',
        type: 'ssh',
        hostname: '192.168.1.1',
        port: 22,
        username: 'root',
        password: 'secret',
      };
      mockHostsService.create.mockResolvedValue(strippedHost);

      const result = await controller.create(dto);

      expect(mockHostsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(strippedHost);
    });
  });

  describe('PATCH /:id', () => {
    it('should call update with id and dto', async () => {
      const dto = { name: 'Updated Host' };
      mockHostsService.update.mockResolvedValue({
        ...strippedHost,
        name: 'Updated Host',
      });

      const result = await controller.update(strippedHost.id, dto);

      expect(mockHostsService.update).toHaveBeenCalledWith(
        strippedHost.id,
        dto,
      );
      expect(result.name).toBe('Updated Host');
    });

    it('should propagate NotFoundException from service', async () => {
      mockHostsService.update.mockRejectedValue(
        new NotFoundException('Host not found'),
      );

      await expect(
        controller.update('nonexistent', { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /:id', () => {
    it('should call remove with id', async () => {
      mockHostsService.remove.mockResolvedValue(undefined);

      await controller.remove(strippedHost.id);

      expect(mockHostsService.remove).toHaveBeenCalledWith(strippedHost.id);
    });

    it('should propagate NotFoundException from service', async () => {
      mockHostsService.remove.mockRejectedValue(
        new NotFoundException('Host not found'),
      );

      await expect(controller.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
