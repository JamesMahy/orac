import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { projectId },
      include: { workspaces: true },
    });
    if (!project) {
      throw new NotFoundException('project_not_found');
    }
    return project;
  }

  async create(dto: CreateProjectDto) {
    const { name, description } = dto;
    return this.prisma.project.create({
      data: { name, description },
    });
  }

  async update(projectId: string, dto: UpdateProjectDto) {
    const { name, description } = dto;

    const existing = await this.prisma.project.findUnique({
      where: { projectId },
    });
    if (!existing) {
      throw new NotFoundException('project_not_found');
    }

    return this.prisma.project.update({
      where: { projectId },
      data: { name, description },
    });
  }

  async remove(projectId: string) {
    const existing = await this.prisma.project.findUnique({
      where: { projectId },
    });

    if (!existing) {
      throw new NotFoundException('project_not_found');
    }
    return this.prisma.project.delete({ where: { projectId } });
  }
}
