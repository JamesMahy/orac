import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { HostResponseDto } from './hosts.dto';

export const HostsDocs = {
  findAll: applyDecorators(
    ApiOperation({ summary: 'List all hosts' }),
    ApiResponse({
      status: 200,
      description: 'List of hosts',
      type: [HostResponseDto],
    }),
  ),

  findOne: applyDecorators(
    ApiOperation({ summary: 'Get a host by ID' }),
    ApiParam({ name: 'id', description: 'Host UUID', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Host found',
      type: HostResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Host not found' }),
  ),

  create: applyDecorators(
    ApiOperation({ summary: 'Create a new host' }),
    ApiResponse({
      status: 201,
      description: 'Host created',
      type: HostResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
  ),

  update: applyDecorators(
    ApiOperation({ summary: 'Update a host' }),
    ApiParam({ name: 'id', description: 'Host UUID', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Host updated',
      type: HostResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 404, description: 'Host not found' }),
  ),

  remove: applyDecorators(
    ApiOperation({ summary: 'Delete a host' }),
    ApiParam({ name: 'id', description: 'Host UUID', format: 'uuid' }),
    ApiResponse({ status: 204, description: 'Host deleted' }),
    ApiResponse({ status: 404, description: 'Host not found' }),
  ),
};
