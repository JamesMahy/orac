import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { WorkspacesService } from '../workspaces.service';

const projectId = '550e8400-e29b-41d4-a716-446655440000';
const hostId = '660e8400-e29b-41d4-a716-446655440000';

const mockWorkspace = {
  workspaceId: '770e8400-e29b-41d4-a716-446655440000',
  projectId,
  hostId,
  name: 'exercise-service',
  path: '/home/james/bearly-fit/exercise-service',
  sessionId: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockProject = { projectId, name: 'Bearly Fit' };
const mockHost = { hostId, name: 'SSH Host A' };

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prisma: {
    workspace: Record<string, jest.Mock>;
    project: Record<string, jest.Mock>;
    host: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      workspace: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      project: {
        findUnique: jest.fn(),
      },
      host: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(WorkspacesService);
  });

  describe('findAll', () => {
    it('should return workspaces for a project ordered by createdAt desc with workspaceId', async () => {
      prisma.workspace.findMany.mockResolvedValue([mockWorkspace]);

      const result = await service.findAll(projectId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('workspaceId', mockWorkspace.workspaceId);
      expect(result[0]).toHaveProperty('name', 'exercise-service');
      expect(prisma.workspace.findMany).toHaveBeenCalledWith({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no workspaces exist', async () => {
      prisma.workspace.findMany.mockResolvedValue([]);

      const result = await service.findAll(projectId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return the workspace with workspaceId', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      const result = await service.findOne(mockWorkspace.workspaceId);

      expect(result).toHaveProperty('workspaceId', mockWorkspace.workspaceId);
      expect(result).toHaveProperty('name', 'exercise-service');
      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspace.workspaceId },
      });
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use snake_case error code', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'workspace_not_found',
      );
    });
  });

  describe('create', () => {
    it('should create and return a workspace with workspaceId', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.host.findUnique.mockResolvedValue(mockHost);
      prisma.workspace.create.mockResolvedValue(mockWorkspace);

      const result = await service.create({
        projectId,
        hostId,
        name: 'exercise-service',
        path: '/home/james/bearly-fit/exercise-service',
      });

      expect(result).toHaveProperty('workspaceId', mockWorkspace.workspaceId);
      expect(result).toHaveProperty('name', 'exercise-service');
      expect(prisma.workspace.create).toHaveBeenCalledWith({
        data: {
          projectId,
          hostId,
          name: 'exercise-service',
          path: '/home/james/bearly-fit/exercise-service',
        },
      });
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          projectId: 'nonexistent',
          hostId,
          name: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for missing project', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          projectId: 'nonexistent',
          hostId,
          name: 'test',
        }),
      ).rejects.toThrow('project_not_found');
    });

    it('should throw NotFoundException when host does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          projectId,
          hostId: 'nonexistent',
          name: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for missing host', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          projectId,
          hostId: 'nonexistent',
          name: 'test',
        }),
      ).rejects.toThrow('host_not_found');
    });
  });

  describe('update', () => {
    it('should update and return the workspace with workspaceId', async () => {
      const updated = { ...mockWorkspace, name: 'Updated Name' };
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.workspace.update.mockResolvedValue(updated);

      const result = await service.update(mockWorkspace.workspaceId, {
        name: 'Updated Name',
      });

      expect(result).toHaveProperty('workspaceId', mockWorkspace.workspaceId);
      expect(result).toHaveProperty('name', 'Updated Name');
      expect(prisma.workspace.update).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspace.workspaceId },
        data: { name: 'Updated Name', path: undefined },
      });
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'x' }),
      ).rejects.toThrow('workspace_not_found');
    });
  });

  describe('remove', () => {
    it('should delete the workspace', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.workspace.delete.mockResolvedValue(mockWorkspace);

      await service.remove(mockWorkspace.workspaceId);

      expect(prisma.workspace.delete).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspace.workspaceId },
      });
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use snake_case error code', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        'workspace_not_found',
      );
    });
  });
});
