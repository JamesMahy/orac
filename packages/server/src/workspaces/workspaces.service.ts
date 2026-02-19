import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  AddWorkspaceClankerDto,
} from './workspaces.dto';

type WorkspaceResponse = {
  workspaceId: string;
  projectId: string;
  name: string;
  hostId: string | null;
  path: string | null;
  primaryClankerId: string | null;
  primaryClanker: { clankerId: string; name: string } | null;
  currentClankerId: string | null;
  clankers: {
    clankerId: string;
    name: string;
    modelOverride: string | null;
    temperatureOverride: number | null;
  }[];
  sessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const workspaceInclude = {
  primaryClanker: {
    select: { clankerId: true, name: true },
  },
  clankers: {
    select: {
      clanker: { select: { clankerId: true, name: true } },
      modelOverride: true,
      temperatureOverride: true,
    },
  },
} as const;

function toResponse(
  workspace: Prisma.WorkspaceGetPayload<{ include: typeof workspaceInclude }>,
): WorkspaceResponse {
  const {
    workspaceId,
    projectId,
    name,
    hostId,
    path,
    primaryClankerId,
    primaryClanker,
    currentClankerId,
    clankers,
    sessionId,
    createdAt,
    updatedAt,
  } = workspace;

  const mappedClankers = clankers.map(
    ({ clanker, modelOverride, temperatureOverride }) => ({
      clankerId: clanker.clankerId,
      name: clanker.name,
      modelOverride,
      temperatureOverride,
    }),
  );

  const mappedPrimaryClanker = primaryClanker
    ? { clankerId: primaryClanker.clankerId, name: primaryClanker.name }
    : null;

  return {
    workspaceId,
    projectId,
    name,
    hostId,
    path,
    primaryClankerId,
    primaryClanker: mappedPrimaryClanker,
    currentClankerId,
    clankers: mappedClankers,
    sessionId,
    createdAt,
    updatedAt,
  };
}

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId: string) {
    const workspaces = await this.prisma.workspace.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: workspaceInclude,
    });
    return workspaces.map(toResponse);
  }

  async findOne(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { workspaceId },
      include: workspaceInclude,
    });
    if (!workspace) {
      throw new NotFoundException('workspace_not_found');
    }
    return toResponse(workspace);
  }

  async create(dto: CreateWorkspaceDto) {
    const { projectId, primaryClankerId, hostId, name, path, clankers } = dto;

    const project = await this.prisma.project.findUnique({
      where: { projectId },
    });
    if (!project) {
      throw new NotFoundException('project_not_found');
    }

    const clanker = await this.prisma.clanker.findUnique({
      where: { clankerId: primaryClankerId },
    });
    if (!clanker) {
      throw new NotFoundException('clanker_not_found');
    }

    if (hostId) {
      const host = await this.prisma.host.findUnique({ where: { hostId } });
      if (!host) {
        throw new NotFoundException('host_not_found');
      }
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        projectId,
        primaryClankerId,
        hostId,
        name,
        path,
        clankers:
          clankers && clankers.length > 0
            ? {
                create: clankers.map(
                  ({ clankerId, modelOverride, temperatureOverride }) => ({
                    clankerId,
                    modelOverride,
                    temperatureOverride,
                  }),
                ),
              }
            : undefined,
      },
      include: workspaceInclude,
    });

    return toResponse(workspace);
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto) {
    const { name, path, hostId, primaryClankerId, currentClankerId } = dto;

    const existing = await this.prisma.workspace.findUnique({
      where: { workspaceId },
    });
    if (!existing) {
      throw new NotFoundException('workspace_not_found');
    }

    if (primaryClankerId) {
      const clanker = await this.prisma.clanker.findUnique({
        where: { clankerId: primaryClankerId },
      });
      if (!clanker) {
        throw new NotFoundException('clanker_not_found');
      }
    }

    if (currentClankerId) {
      const clanker = await this.prisma.clanker.findUnique({
        where: { clankerId: currentClankerId },
      });
      if (!clanker) {
        throw new NotFoundException('clanker_not_found');
      }
    }

    if (hostId) {
      const host = await this.prisma.host.findUnique({ where: { hostId } });
      if (!host) {
        throw new NotFoundException('host_not_found');
      }
    }

    const workspace = await this.prisma.workspace.update({
      where: { workspaceId },
      data: { name, path, hostId, primaryClankerId, currentClankerId },
      include: workspaceInclude,
    });

    return toResponse(workspace);
  }

  async remove(workspaceId: string) {
    const existing = await this.prisma.workspace.findUnique({
      where: { workspaceId },
    });
    if (!existing) {
      throw new NotFoundException('workspace_not_found');
    }
    return this.prisma.workspace.delete({ where: { workspaceId } });
  }

  async addClanker(workspaceId: string, dto: AddWorkspaceClankerDto) {
    const { clankerId, modelOverride, temperatureOverride } = dto;

    const workspace = await this.prisma.workspace.findUnique({
      where: { workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('workspace_not_found');
    }

    const clanker = await this.prisma.clanker.findUnique({
      where: { clankerId },
    });
    if (!clanker) {
      throw new NotFoundException('clanker_not_found');
    }

    try {
      await this.prisma.workspaceClanker.create({
        data: { workspaceId, clankerId, modelOverride, temperatureOverride },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('clanker_already_added');
      }
      throw error;
    }
  }

  async removeClanker(workspaceId: string, clankerId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('workspace_not_found');
    }

    const workspaceClanker = await this.prisma.workspaceClanker.findUnique({
      where: { workspaceId_clankerId: { workspaceId, clankerId } },
    });
    if (!workspaceClanker) {
      throw new NotFoundException('workspace_clanker_not_found');
    }

    return this.prisma.workspaceClanker.delete({
      where: { workspaceId_clankerId: { workspaceId, clankerId } },
    });
  }
}
