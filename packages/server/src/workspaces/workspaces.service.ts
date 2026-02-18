import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './workspaces.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.workspace.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('workspace_not_found');
    }
    return workspace;
  }

  async create(dto: CreateWorkspaceDto) {
    const project = await this.prisma.project.findUnique({
      where: { projectId: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('project_not_found');
    }

    const host = await this.prisma.host.findUnique({
      where: { hostId: dto.hostId },
    });
    if (!host) {
      throw new NotFoundException('host_not_found');
    }

    return this.prisma.workspace.create({
      data: {
        projectId: dto.projectId,
        hostId: dto.hostId,
        name: dto.name,
        path: dto.path,
      },
    });
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto) {
    const existing = await this.prisma.workspace.findUnique({
      where: { workspaceId },
    });
    if (!existing) {
      throw new NotFoundException('workspace_not_found');
    }
    return this.prisma.workspace.update({
      where: { workspaceId },
      data: {
        name: dto.name,
        path: dto.path,
      },
    });
  }

  async remove(workspaceId: string) {
    const existing = await this.prisma.workspace.findUnique({
      where: { workspaceId },
    });
    if (!existing) {
      throw new NotFoundException('workspace_not_found');
    }
    await this.prisma.workspace.delete({ where: { workspaceId } });
  }
}
