import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './projects.dto';
import { ProjectsDocs } from './projects.docs';

@ApiTags('Projects')
@ApiCookieAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ProjectsDocs.findAll
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':projectId')
  @ProjectsDocs.findOne
  findOne(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectsService.findOne(projectId);
  }

  @Post()
  @ProjectsDocs.create
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Patch(':projectId')
  @ProjectsDocs.update
  update(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(projectId, dto);
  }

  @Delete(':projectId')
  @HttpCode(204)
  @ProjectsDocs.remove
  remove(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectsService.remove(projectId);
  }
}
