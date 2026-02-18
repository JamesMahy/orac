import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectsController } from '../projects.controller';
import { ProjectsService } from '../projects.service';

const mockProject = {
  projectId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Bearly Fit',
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let mockProjectsService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockProjectsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: mockProjectsService }],
    }).compile();

    controller = module.get(ProjectsController);
  });

  describe('GET /', () => {
    it('should call findAll and return result', async () => {
      mockProjectsService.findAll.mockResolvedValue([mockProject]);

      const result = await controller.findAll();

      expect(mockProjectsService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockProject]);
    });
  });

  describe('GET /:projectId', () => {
    it('should call findOne with projectId', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);

      const result = await controller.findOne(mockProject.projectId);

      expect(mockProjectsService.findOne).toHaveBeenCalledWith(
        mockProject.projectId,
      );
      expect(result).toEqual(mockProject);
    });

    it('should propagate NotFoundException from service', async () => {
      mockProjectsService.findOne.mockRejectedValue(
        new NotFoundException('project_not_found'),
      );

      await expect(controller.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('POST /', () => {
    it('should call create with dto', async () => {
      const dto = { name: 'Bearly Fit' };
      mockProjectsService.create.mockResolvedValue(mockProject);

      const result = await controller.create(dto);

      expect(mockProjectsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockProject);
    });
  });

  describe('PATCH /:projectId', () => {
    it('should call update with projectId and dto', async () => {
      const dto = { name: 'Updated Name' };
      mockProjectsService.update.mockResolvedValue({
        ...mockProject,
        name: 'Updated Name',
      });

      const result = await controller.update(mockProject.projectId, dto);

      expect(mockProjectsService.update).toHaveBeenCalledWith(
        mockProject.projectId,
        dto,
      );
      expect(result.name).toBe('Updated Name');
    });

    it('should propagate NotFoundException from service', async () => {
      mockProjectsService.update.mockRejectedValue(
        new NotFoundException('project_not_found'),
      );

      await expect(
        controller.update('nonexistent', { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /:projectId', () => {
    it('should call remove with projectId', async () => {
      mockProjectsService.remove.mockResolvedValue(undefined);

      await controller.remove(mockProject.projectId);

      expect(mockProjectsService.remove).toHaveBeenCalledWith(
        mockProject.projectId,
      );
    });

    it('should propagate NotFoundException from service', async () => {
      mockProjectsService.remove.mockRejectedValue(
        new NotFoundException('project_not_found'),
      );

      await expect(controller.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
