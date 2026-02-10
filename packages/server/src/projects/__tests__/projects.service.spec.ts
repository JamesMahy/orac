import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { ProjectsService } from '../projects.service';

const mockProject = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Bearly Fit',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockWorkspace = {
  id: '660e8400-e29b-41d4-a716-446655440000',
  projectId: mockProject.id,
  hostId: '770e8400-e29b-41d4-a716-446655440000',
  name: 'exercise-service',
  path: '/home/james/bearly-fit/exercise-service',
  sessionId: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: { project: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ProjectsService);
  });

  describe('findAll', () => {
    it('should return all projects ordered by createdAt desc', async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);

      const result = await service.findAll();

      expect(result).toEqual([mockProject]);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return project with workspaces', async () => {
      const projectWithWorkspaces = {
        ...mockProject,
        workspaces: [mockWorkspace],
      };
      prisma.project.findUnique.mockResolvedValue(projectWithWorkspaces);

      const result = await service.findOne(mockProject.id);

      expect(result).toEqual(projectWithWorkspaces);
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        include: { workspaces: true },
      });
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use snake_case error code', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'project_not_found',
      );
    });
  });

  describe('create', () => {
    it('should create and return a project', async () => {
      prisma.project.create.mockResolvedValue(mockProject);

      const result = await service.create({ name: 'Bearly Fit' });

      expect(result).toEqual(mockProject);
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: { name: 'Bearly Fit' },
      });
    });
  });

  describe('update', () => {
    it('should update and return the project', async () => {
      const updated = { ...mockProject, name: 'Updated Name' };
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.project.update.mockResolvedValue(updated);

      const result = await service.update(mockProject.id, {
        name: 'Updated Name',
      });

      expect(result).toEqual(updated);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        data: { name: 'Updated Name' },
      });
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'x' }),
      ).rejects.toThrow('project_not_found');
    });
  });

  describe('remove', () => {
    it('should delete the project', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.project.delete.mockResolvedValue(mockProject);

      await service.remove(mockProject.id);

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: mockProject.id },
      });
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use snake_case error code', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        'project_not_found',
      );
    });
  });
});
