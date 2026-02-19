import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  ListWorkspacesQueryDto,
  AddWorkspaceClankerDto,
} from './workspaces.dto';
import { WorkspacesDocs } from './workspaces.docs';

@ApiTags('Workspaces')
@ApiCookieAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @WorkspacesDocs.findAll
  findAll(@Query() query: ListWorkspacesQueryDto) {
    return this.workspacesService.findAll(query.projectId);
  }

  @Get(':workspaceId')
  @WorkspacesDocs.findOne
  findOne(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.workspacesService.findOne(workspaceId);
  }

  @Post()
  @WorkspacesDocs.create
  create(@Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(dto);
  }

  @Patch(':workspaceId')
  @WorkspacesDocs.update
  update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(workspaceId, dto);
  }

  @Delete(':workspaceId')
  @HttpCode(204)
  @WorkspacesDocs.remove
  remove(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.workspacesService.remove(workspaceId);
  }

  @Post(':workspaceId/clankers')
  @HttpCode(204)
  @WorkspacesDocs.addClanker
  addClanker(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: AddWorkspaceClankerDto,
  ) {
    return this.workspacesService.addClanker(workspaceId, dto);
  }

  @Delete(':workspaceId/clankers/:clankerId')
  @HttpCode(204)
  @WorkspacesDocs.removeClanker
  removeClanker(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('clankerId', ParseUUIDPipe) clankerId: string,
  ) {
    return this.workspacesService.removeClanker(workspaceId, clankerId);
  }
}
