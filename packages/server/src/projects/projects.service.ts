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

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { workspaces: true },
    });
    if (!project) {
      throw new NotFoundException('project_not_found');
    }
    return project;
  }

  async create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: { name: dto.name, description: dto.description },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    const existing = await this.prisma.project.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('project_not_found');
    }
    return this.prisma.project.update({
      where: { id },
      data: { name: dto.name, description: dto.description },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.project.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('project_not_found');
    }
    await this.prisma.project.delete({ where: { id } });
  }
}
