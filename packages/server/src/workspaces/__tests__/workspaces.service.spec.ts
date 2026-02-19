import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import { WorkspacesService } from '../workspaces.service';

const projectId = '550e8400-e29b-41d4-a716-446655440000';
const hostId = '660e8400-e29b-41d4-a716-446655440000';
const clankerId = '880e8400-e29b-41d4-a716-446655440000';

const mockClanker = { clankerId, name: 'Claude Code' };
const mockProject = { projectId, name: 'Bearly Fit' };
const mockHost = { hostId, name: 'SSH Host A' };

const mockWorkspace = {
  workspaceId: '770e8400-e29b-41d4-a716-446655440000',
  projectId,
  hostId,
  name: 'exercise-service',
  path: '/home/james/bearly-fit/exercise-service',
  primaryClankerId: clankerId,
  primaryClanker: mockClanker,
  currentClankerId: null,
  clankers: [],
  sessionId: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prisma: {
    workspace: Record<string, jest.Mock>;
    project: Record<string, jest.Mock>;
    host: Record<string, jest.Mock>;
    clanker: Record<string, jest.Mock>;
    workspaceClanker: Record<string, jest.Mock>;
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
      clanker: {
        findUnique: jest.fn(),
      },
      workspaceClanker: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
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
      expect(result[0]).toHaveProperty('primaryClanker', mockClanker);
      expect(result[0]).toHaveProperty('clankers', []);
      expect(prisma.workspace.findMany).toHaveBeenCalledWith({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        include: {
          primaryClanker: { select: { clankerId: true, name: true } },
          clankers: {
            select: {
              clanker: { select: { clankerId: true, name: true } },
              modelOverride: true,
              temperatureOverride: true,
            },
          },
        },
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
      expect(result).toHaveProperty('primaryClanker', mockClanker);
      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspace.workspaceId },
        include: {
          primaryClanker: { select: { clankerId: true, name: true } },
          clankers: {
            select: {
              clanker: { select: { clankerId: true, name: true } },
              modelOverride: true,
              temperatureOverride: true,
            },
          },
        },
      });
    });

    it('should unwrap nested clanker relation in the clankers array', async () => {
      const workspaceWithClanker = {
        ...mockWorkspace,
        clankers: [
          {
            clanker: { clankerId, name: 'Claude Code' },
            modelOverride: 'claude-opus-4-6',
            temperatureOverride: 0.7,
          },
        ],
      };
      prisma.workspace.findUnique.mockResolvedValue(workspaceWithClanker);

      const result = await service.findOne(workspaceWithClanker.workspaceId);

      expect(result.clankers).toEqual([
        {
          clankerId,
          name: 'Claude Code',
          modelOverride: 'claude-opus-4-6',
          temperatureOverride: 0.7,
        },
      ]);
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
    it('should create and return a workspace with primaryClankerId', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.clanker.findUnique.mockResolvedValue(mockClanker);
      prisma.workspace.create.mockResolvedValue(mockWorkspace);

      const result = await service.create({
        projectId,
        primaryClankerId: clankerId,
        name: 'exercise-service',
        path: '/home/james/bearly-fit/exercise-service',
      });

      expect(result).toHaveProperty('workspaceId', mockWorkspace.workspaceId);
      expect(result).toHaveProperty('name', 'exercise-service');
      expect(result).toHaveProperty('primaryClanker', mockClanker);
    });

    it('should call workspace.create with correct data', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.clanker.findUnique.mockResolvedValue(mockClanker);
      prisma.workspace.create.mockResolvedValue(mockWorkspace);

      await service.create({
        projectId,
        primaryClankerId: clankerId,
        name: 'exercise-service',
        path: '/home/james/bearly-fit/exercise-service',
      });

      expect(prisma.workspace.create).toHaveBeenCalledWith({
        data: {
          projectId,
          primaryClankerId: clankerId,
          hostId: undefined,
          name: 'exercise-service',
          path: '/home/james/bearly-fit/exercise-service',
          clankers: undefined,
        },
        include: {
          primaryClanker: { select: { clankerId: true, name: true } },
          clankers: {
            select: {
              clanker: { select: { clankerId: true, name: true } },
              modelOverride: true,
              temperatureOverride: true,
            },
          },
        },
      });
    });

    it('should create WorkspaceClanker entries when clankers are provided', async () => {
      const secondClankerId = '990e8400-e29b-41d4-a716-446655440000';
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.clanker.findUnique.mockResolvedValue(mockClanker);
      prisma.workspace.create.mockResolvedValue(mockWorkspace);

      await service.create({
        projectId,
        primaryClankerId: clankerId,
        name: 'exercise-service',
        clankers: [
          { clankerId: secondClankerId, modelOverride: 'claude-opus-4-6', temperatureOverride: 0.9 },
        ],
      });

      expect(prisma.workspace.create).toHaveBeenCalledWith({
        data: {
          projectId,
          primaryClankerId: clankerId,
          hostId: undefined,
          name: 'exercise-service',
          path: undefined,
          clankers: {
            create: [
              {
                clankerId: secondClankerId,
                modelOverride: 'claude-opus-4-6',
                temperatureOverride: 0.9,
              },
            ],
          },
        },
        include: {
          primaryClanker: { select: { clankerId: true, name: true } },
          clankers: {
            select: {
              clanker: { select: { clankerId: true, name: true } },
              modelOverride: true,
              temperatureOverride: true,
            },
          },
        },
      });
    });

    it('should validate hostId when provided', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.clanker.findUnique.mockResolvedValue(mockClanker);
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          projectId,
          primaryClankerId: clankerId,
          hostId: 'nonexistent-host',
          name: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for missing host', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.clanker.findUnique.mockResolvedValue(mockClanker);
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          projectId,
          primaryClankerId: clankerId,
          hostId: 'nonexistent-host',
          name: 'test',
        }),
      ).rejects.toThrow('host_not_found');
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          projectId: 'nonexistent',
          primaryClankerId: clankerId,
          name: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for missing project', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          projectId: 'nonexistent',
          primaryClankerId: clankerId,
          name: 'test',
        }),
      ).rejects.toThrow('project_not_found');
    });

    it('should throw NotFoundException when primary clanker does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.clanker.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          projectId,
          primaryClankerId: 'nonexistent',
          name: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for missing clanker', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.clanker.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          projectId,
          primaryClankerId: 'nonexistent',
          name: 'test',
        }),
      ).rejects.toThrow('clanker_not_found');
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

    it('should throw NotFoundException when updated primaryClankerId does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.clanker.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockWorkspace.workspaceId, {
          primaryClankerId: 'nonexistent-clanker',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for missing primaryClankerId on update', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.clanker.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockWorkspace.workspaceId, {
          primaryClankerId: 'nonexistent-clanker',
        }),
      ).rejects.toThrow('clanker_not_found');
    });

    it('should throw NotFoundException when updated hostId does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockWorkspace.workspaceId, {
          hostId: 'nonexistent-host',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for missing hostId on update', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.host.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockWorkspace.workspaceId, {
          hostId: 'nonexistent-host',
        }),
      ).rejects.toThrow('host_not_found');
    });

    it('should update currentClankerId when a valid clanker is provided', async () => {
      const updated = { ...mockWorkspace, currentClankerId: clankerId };
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.clanker.findUnique.mockResolvedValue(mockClanker);
      prisma.workspace.update.mockResolvedValue(updated);

      const result = await service.update(mockWorkspace.workspaceId, {
        currentClankerId: clankerId,
      });

      expect(result).toHaveProperty('currentClankerId', clankerId);
      expect(prisma.clanker.findUnique).toHaveBeenCalledWith({
        where: { clankerId },
      });
    });

    it('should accept null currentClankerId to reset to primary', async () => {
      const updated = { ...mockWorkspace, currentClankerId: null };
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.workspace.update.mockResolvedValue(updated);

      const result = await service.update(mockWorkspace.workspaceId, {
        currentClankerId: null,
      });

      expect(result).toHaveProperty('currentClankerId', null);
      expect(prisma.clanker.findUnique).not.toHaveBeenCalled();
    });

    it('should accept null hostId to clear the host association', async () => {
      const updated = { ...mockWorkspace, hostId: null };
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.workspace.update.mockResolvedValue(updated);

      const result = await service.update(mockWorkspace.workspaceId, {
        hostId: null,
      });

      expect(result).toHaveProperty('hostId', null);
      expect(prisma.host.findUnique).not.toHaveBeenCalled();
    });

    it('should validate a provided hostId and update successfully', async () => {
      const updated = { ...mockWorkspace, hostId };
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.host.findUnique.mockResolvedValue(mockHost);
      prisma.workspace.update.mockResolvedValue(updated);

      const result = await service.update(mockWorkspace.workspaceId, { hostId });

      expect(result).toHaveProperty('hostId', hostId);
      expect(prisma.host.findUnique).toHaveBeenCalledWith({ where: { hostId } });
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

  describe('addClanker', () => {
    it('should create a WorkspaceClanker association without overrides', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.clanker.findUnique.mockResolvedValue(mockClanker);
      prisma.workspaceClanker.create.mockResolvedValue({});

      await service.addClanker(mockWorkspace.workspaceId, { clankerId });

      expect(prisma.workspaceClanker.create).toHaveBeenCalledWith({
        data: {
          workspaceId: mockWorkspace.workspaceId,
          clankerId,
          modelOverride: undefined,
          temperatureOverride: undefined,
        },
      });
    });

    it('should create a WorkspaceClanker association with overrides', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.clanker.findUnique.mockResolvedValue(mockClanker);
      prisma.workspaceClanker.create.mockResolvedValue({});

      await service.addClanker(mockWorkspace.workspaceId, {
        clankerId,
        modelOverride: 'claude-opus-4-6',
        temperatureOverride: 0.9,
      });

      expect(prisma.workspaceClanker.create).toHaveBeenCalledWith({
        data: {
          workspaceId: mockWorkspace.workspaceId,
          clankerId,
          modelOverride: 'claude-opus-4-6',
          temperatureOverride: 0.9,
        },
      });
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.addClanker('nonexistent', { clankerId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for missing workspace', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.addClanker('nonexistent', { clankerId }),
      ).rejects.toThrow('workspace_not_found');
    });

    it('should throw NotFoundException when clanker does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.clanker.findUnique.mockResolvedValue(null);

      await expect(
        service.addClanker(mockWorkspace.workspaceId, { clankerId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for missing clanker', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.clanker.findUnique.mockResolvedValue(null);

      await expect(
        service.addClanker(mockWorkspace.workspaceId, { clankerId: 'nonexistent' }),
      ).rejects.toThrow('clanker_not_found');
    });

    it('should throw ConflictException on unique constraint violation', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.clanker.findUnique.mockResolvedValue(mockClanker);
      const uniqueError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0', meta: {} },
      );
      prisma.workspaceClanker.create.mockRejectedValue(uniqueError);

      await expect(
        service.addClanker(mockWorkspace.workspaceId, { clankerId }),
      ).rejects.toThrow(ConflictException);
    });

    it('should use snake_case error code for duplicate clanker', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.clanker.findUnique.mockResolvedValue(mockClanker);
      const uniqueError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0', meta: {} },
      );
      prisma.workspaceClanker.create.mockRejectedValue(uniqueError);

      await expect(
        service.addClanker(mockWorkspace.workspaceId, { clankerId }),
      ).rejects.toThrow('clanker_already_added');
    });

    it('should rethrow non-constraint errors from workspaceClanker.create', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.clanker.findUnique.mockResolvedValue(mockClanker);
      const unexpectedError = new Error('Database connection lost');
      prisma.workspaceClanker.create.mockRejectedValue(unexpectedError);

      await expect(
        service.addClanker(mockWorkspace.workspaceId, { clankerId }),
      ).rejects.toThrow('Database connection lost');
    });
  });

  describe('removeClanker', () => {
    const mockWorkspaceClanker = {
      workspaceId: mockWorkspace.workspaceId,
      clankerId,
      createdAt: new Date('2025-01-01'),
    };

    it('should delete the WorkspaceClanker association', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.workspaceClanker.findUnique.mockResolvedValue(mockWorkspaceClanker);
      prisma.workspaceClanker.delete.mockResolvedValue(mockWorkspaceClanker);

      await service.removeClanker(mockWorkspace.workspaceId, clankerId);

      expect(prisma.workspaceClanker.delete).toHaveBeenCalledWith({
        where: {
          workspaceId_clankerId: {
            workspaceId: mockWorkspace.workspaceId,
            clankerId,
          },
        },
      });
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.removeClanker('nonexistent', clankerId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for missing workspace', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.removeClanker('nonexistent', clankerId),
      ).rejects.toThrow('workspace_not_found');
    });

    it('should throw NotFoundException when association does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.workspaceClanker.findUnique.mockResolvedValue(null);

      await expect(
        service.removeClanker(mockWorkspace.workspaceId, clankerId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for missing association', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.workspaceClanker.findUnique.mockResolvedValue(null);

      await expect(
        service.removeClanker(mockWorkspace.workspaceId, clankerId),
      ).rejects.toThrow('workspace_clanker_not_found');
    });
  });
});
