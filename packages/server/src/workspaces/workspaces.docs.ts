import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { WorkspaceResponseDto, AddWorkspaceClankerDto } from './workspaces.dto';

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
      name: 'workspaceId',
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
    ApiResponse({
      status: 404,
      description: 'Project, clanker, or host not found',
    }),
  ),

  update: applyDecorators(
    ApiOperation({ summary: 'Update a workspace' }),
    ApiParam({
      name: 'workspaceId',
      description: 'Workspace UUID',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'Workspace updated',
      type: WorkspaceResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({
      status: 404,
      description: 'Workspace, clanker, or host not found',
    }),
  ),

  remove: applyDecorators(
    ApiOperation({ summary: 'Delete a workspace' }),
    ApiParam({
      name: 'workspaceId',
      description: 'Workspace UUID',
      format: 'uuid',
    }),
    ApiResponse({ status: 204, description: 'Workspace deleted' }),
    ApiResponse({ status: 404, description: 'Workspace not found' }),
  ),

  addClanker: applyDecorators(
    ApiOperation({ summary: 'Associate a clanker with a workspace' }),
    ApiParam({
      name: 'workspaceId',
      description: 'Workspace UUID',
      format: 'uuid',
    }),
    ApiBody({ type: AddWorkspaceClankerDto }),
    ApiResponse({ status: 204, description: 'Clanker associated' }),
    ApiResponse({ status: 404, description: 'Workspace or clanker not found' }),
    ApiResponse({ status: 409, description: 'Clanker already associated' }),
  ),

  removeClanker: applyDecorators(
    ApiOperation({ summary: 'Remove a clanker association from a workspace' }),
    ApiParam({
      name: 'workspaceId',
      description: 'Workspace UUID',
      format: 'uuid',
    }),
    ApiParam({
      name: 'clankerId',
      description: 'Clanker UUID',
      format: 'uuid',
    }),
    ApiResponse({ status: 204, description: 'Clanker association removed' }),
    ApiResponse({
      status: 404,
      description: 'Workspace or association not found',
    }),
  ),
};
