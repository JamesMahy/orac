import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ProjectResponseDto } from './projects.dto';

export const ProjectsDocs = {
  findAll: applyDecorators(
    ApiOperation({ summary: 'List all projects' }),
    ApiResponse({
      status: 200,
      description: 'List of projects',
      type: [ProjectResponseDto],
    }),
  ),

  findOne: applyDecorators(
    ApiOperation({ summary: 'Get a project by ID' }),
    ApiParam({
      name: 'projectId',
      description: 'Project UUID',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'Project found',
      type: ProjectResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Project not found' }),
  ),

  create: applyDecorators(
    ApiOperation({ summary: 'Create a new project' }),
    ApiResponse({
      status: 201,
      description: 'Project created',
      type: ProjectResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
  ),

  update: applyDecorators(
    ApiOperation({ summary: 'Update a project' }),
    ApiParam({
      name: 'projectId',
      description: 'Project UUID',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'Project updated',
      type: ProjectResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 404, description: 'Project not found' }),
  ),

  remove: applyDecorators(
    ApiOperation({ summary: 'Delete a project' }),
    ApiParam({
      name: 'projectId',
      description: 'Project UUID',
      format: 'uuid',
    }),
    ApiResponse({ status: 204, description: 'Project deleted' }),
    ApiResponse({ status: 404, description: 'Project not found' }),
  ),
};
