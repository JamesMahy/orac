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
    const { projectId, hostId, name, path } = dto;
    const project = await this.prisma.project.findUnique({
      where: { projectId },
    });
    if (!project) {
      throw new NotFoundException('project_not_found');
    }

    const host = await this.prisma.host.findUnique({
      where: { hostId },
    });
    if (!host) {
      throw new NotFoundException('host_not_found');
    }

    return this.prisma.workspace.create({
      data: { projectId, hostId, name, path },
    });
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto) {
    const { name, path } = dto;
    const existing = await this.prisma.workspace.findUnique({
      where: { workspaceId },
    });
    if (!existing) {
      throw new NotFoundException('workspace_not_found');
    }
    return this.prisma.workspace.update({
      where: { workspaceId },
      data: { name, path },
    });
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
}
