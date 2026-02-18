import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { ProjectsService } from '../projects.service';

const mockProject = {
  projectId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Bearly Fit',
  description: 'Fitness tracking application',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockWorkspace = {
  workspaceId: '660e8400-e29b-41d4-a716-446655440000',
  projectId: mockProject.projectId,
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

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('projectId', mockProject.projectId);
      expect(result[0]).toHaveProperty('name', 'Bearly Fit');
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

      const result = await service.findOne(mockProject.projectId);

      expect(result).toHaveProperty('projectId', mockProject.projectId);
      expect(result).toHaveProperty('name', 'Bearly Fit');
      expect(result.workspaces).toHaveLength(1);
      expect(result.workspaces[0]).toHaveProperty(
        'workspaceId',
        mockWorkspace.workspaceId,
      );
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { projectId: mockProject.projectId },
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

      const result = await service.create({
        name: 'Bearly Fit',
        description: 'Fitness tracking application',
      });

      expect(result).toHaveProperty('projectId', mockProject.projectId);
      expect(result).toHaveProperty('name', 'Bearly Fit');
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'Bearly Fit',
          description: 'Fitness tracking application',
        },
      });
    });

    it('should create a project without description', async () => {
      const projectWithoutDescription = {
        ...mockProject,
        description: null,
      };
      prisma.project.create.mockResolvedValue(projectWithoutDescription);

      const result = await service.create({ name: 'Bearly Fit' });

      expect(result).toHaveProperty('projectId', mockProject.projectId);
      expect(result).toHaveProperty('description', null);
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: { name: 'Bearly Fit', description: undefined },
      });
    });
  });

  describe('update', () => {
    it('should update and return the project', async () => {
      const updated = { ...mockProject, name: 'Updated Name' };
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.project.update.mockResolvedValue(updated);

      const result = await service.update(mockProject.projectId, {
        name: 'Updated Name',
      });

      expect(result).toHaveProperty('projectId', mockProject.projectId);
      expect(result).toHaveProperty('name', 'Updated Name');
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { projectId: mockProject.projectId },
        data: { name: 'Updated Name', description: undefined },
      });
    });

    it('should update description', async () => {
      const updated = { ...mockProject, description: 'New description' };
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.project.update.mockResolvedValue(updated);

      const result = await service.update(mockProject.projectId, {
        description: 'New description',
      });

      expect(result).toHaveProperty('projectId', mockProject.projectId);
      expect(result).toHaveProperty('description', 'New description');
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { projectId: mockProject.projectId },
        data: { name: undefined, description: 'New description' },
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

      await service.remove(mockProject.projectId);

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { projectId: mockProject.projectId },
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
