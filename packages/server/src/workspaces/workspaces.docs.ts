import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { WorkspaceResponseDto } from './workspaces.dto';

export const WorkspacesDocs = {
  findAll: applyDecorators(
    ApiOperation({ summary: 'List workspaces for a project' }),
    ApiQuery({
      name: 'projectId',
      description: 'Project UUID',
      type: String,
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'List of workspaces',
      type: [WorkspaceResponseDto],
    }),
  ),

  findOne: applyDecorators(
    ApiOperation({ summary: 'Get a workspace by ID' }),
    ApiParam({
      name: 'id',
      description: 'Workspace UUID',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'Workspace found',
      type: WorkspaceResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Workspace not found' }),
  ),

  create: applyDecorators(
    ApiOperation({ summary: 'Create a new workspace' }),
    ApiResponse({
      status: 201,
      description: 'Workspace created',
      type: WorkspaceResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 404, description: 'Project or host not found' }),
  ),

  update: applyDecorators(
    ApiOperation({ summary: 'Update a workspace' }),
    ApiParam({
      name: 'id',
      description: 'Workspace UUID',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'Workspace updated',
      type: WorkspaceResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 404, description: 'Workspace not found' }),
  ),

  remove: applyDecorators(
    ApiOperation({ summary: 'Delete a workspace' }),
    ApiParam({
      name: 'id',
      description: 'Workspace UUID',
      format: 'uuid',
    }),
    ApiResponse({ status: 204, description: 'Workspace deleted' }),
    ApiResponse({ status: 404, description: 'Workspace not found' }),
  ),
};
