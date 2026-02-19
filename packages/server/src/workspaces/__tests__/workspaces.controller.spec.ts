import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { WorkspacesController } from '../workspaces.controller';
import { WorkspacesService } from '../workspaces.service';

const projectId = '550e8400-e29b-41d4-a716-446655440000';
const clankerId = '880e8400-e29b-41d4-a716-446655440000';

const mockWorkspace = {
  workspaceId: '770e8400-e29b-41d4-a716-446655440000',
  projectId,
  hostId: null,
  name: 'exercise-service',
  path: '/home/james/bearly-fit/exercise-service',
  primaryClankerId: clankerId,
  primaryClanker: { clankerId, name: 'Claude Code' },
  clankers: [],
  sessionId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('WorkspacesController', () => {
  let controller: WorkspacesController;
  let mockWorkspacesService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockWorkspacesService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      addClanker: jest.fn(),
      removeClanker: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [
        { provide: WorkspacesService, useValue: mockWorkspacesService },
      ],
    }).compile();

    controller = module.get(WorkspacesController);
  });

  describe('GET /', () => {
    it('should call findAll with projectId and return result', async () => {
      mockWorkspacesService.findAll.mockResolvedValue([mockWorkspace]);

      const result = await controller.findAll({ projectId });

      expect(mockWorkspacesService.findAll).toHaveBeenCalledWith(projectId);
      expect(result).toEqual([mockWorkspace]);
    });
  });

  describe('GET /:workspaceId', () => {
    it('should call findOne with workspaceId', async () => {
      mockWorkspacesService.findOne.mockResolvedValue(mockWorkspace);

      const result = await controller.findOne(mockWorkspace.workspaceId);

      expect(mockWorkspacesService.findOne).toHaveBeenCalledWith(
        mockWorkspace.workspaceId,
      );
      expect(result).toEqual(mockWorkspace);
    });

    it('should propagate NotFoundException from service', async () => {
      mockWorkspacesService.findOne.mockRejectedValue(
        new NotFoundException('workspace_not_found'),
      );

      await expect(controller.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('POST /', () => {
    it('should call create with dto', async () => {
      const dto = {
        projectId,
        primaryClankerId: clankerId,
        name: 'exercise-service',
        path: '/home/james/bearly-fit/exercise-service',
      };
      mockWorkspacesService.create.mockResolvedValue(mockWorkspace);

      const result = await controller.create(dto);

      expect(mockWorkspacesService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockWorkspace);
    });
  });

  describe('PATCH /:workspaceId', () => {
    it('should call update with workspaceId and dto', async () => {
      const dto = { name: 'Updated Name' };
      mockWorkspacesService.update.mockResolvedValue({
        ...mockWorkspace,
        name: 'Updated Name',
      });

      const result = await controller.update(mockWorkspace.workspaceId, dto);

      expect(mockWorkspacesService.update).toHaveBeenCalledWith(
        mockWorkspace.workspaceId,
        dto,
      );
      expect(result.name).toBe('Updated Name');
    });

    it('should propagate NotFoundException from service', async () => {
      mockWorkspacesService.update.mockRejectedValue(
        new NotFoundException('workspace_not_found'),
      );

      await expect(
        controller.update('nonexistent', { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /:workspaceId', () => {
    it('should call remove with workspaceId', async () => {
      mockWorkspacesService.remove.mockResolvedValue(undefined);

      await controller.remove(mockWorkspace.workspaceId);

      expect(mockWorkspacesService.remove).toHaveBeenCalledWith(
        mockWorkspace.workspaceId,
      );
    });

    it('should propagate NotFoundException from service', async () => {
      mockWorkspacesService.remove.mockRejectedValue(
        new NotFoundException('workspace_not_found'),
      );

      await expect(controller.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('POST /:workspaceId/clankers', () => {
    it('should call addClanker with workspaceId and clankerId', async () => {
      mockWorkspacesService.addClanker.mockResolvedValue(undefined);

      await controller.addClanker(mockWorkspace.workspaceId, { clankerId });

      expect(mockWorkspacesService.addClanker).toHaveBeenCalledWith(
        mockWorkspace.workspaceId,
        { clankerId },
      );
    });

    it('should propagate ConflictException from service', async () => {
      mockWorkspacesService.addClanker.mockRejectedValue(
        new ConflictException('clanker_already_added'),
      );

      await expect(
        controller.addClanker(mockWorkspace.workspaceId, { clankerId }),
      ).rejects.toThrow(ConflictException);
    });

    it('should propagate NotFoundException from service', async () => {
      mockWorkspacesService.addClanker.mockRejectedValue(
        new NotFoundException('workspace_not_found'),
      );

      await expect(
        controller.addClanker('nonexistent', { clankerId }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /:workspaceId/clankers/:clankerId', () => {
    it('should call removeClanker with workspaceId and clankerId', async () => {
      mockWorkspacesService.removeClanker.mockResolvedValue(undefined);

      await controller.removeClanker(mockWorkspace.workspaceId, clankerId);

      expect(mockWorkspacesService.removeClanker).toHaveBeenCalledWith(
        mockWorkspace.workspaceId,
        clankerId,
      );
    });

    it('should propagate NotFoundException from service', async () => {
      mockWorkspacesService.removeClanker.mockRejectedValue(
        new NotFoundException('workspace_clanker_not_found'),
      );

      await expect(
        controller.removeClanker(mockWorkspace.workspaceId, clankerId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
