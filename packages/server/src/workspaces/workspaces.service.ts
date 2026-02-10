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

  async findOne(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });
    if (!workspace) {
      throw new NotFoundException('workspace_not_found');
    }
    return workspace;
  }

  async create(dto: CreateWorkspaceDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('project_not_found');
    }

    const host = await this.prisma.host.findUnique({
      where: { id: dto.hostId },
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

  async update(id: string, dto: UpdateWorkspaceDto) {
    const existing = await this.prisma.workspace.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('workspace_not_found');
    }
    return this.prisma.workspace.update({
      where: { id },
      data: {
        name: dto.name,
        path: dto.path,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.workspace.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('workspace_not_found');
    }
    await this.prisma.workspace.delete({ where: { id } });
  }
}
