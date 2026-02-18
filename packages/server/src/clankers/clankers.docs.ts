import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ClankerResponseDto } from './clankers.dto';

export const ClankersDocs = {
  findAll: applyDecorators(
    ApiOperation({ summary: 'List all clankers' }),
    ApiResponse({
      status: 200,
      description: 'List of clankers',
      type: [ClankerResponseDto],
    }),
  ),

  findOne: applyDecorators(
    ApiOperation({ summary: 'Get a clanker by ID' }),
    ApiParam({ name: 'clankerId', description: 'Clanker UUID', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Clanker found',
      type: ClankerResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Clanker not found' }),
  ),

  create: applyDecorators(
    ApiOperation({ summary: 'Create a new clanker' }),
    ApiResponse({
      status: 201,
      description: 'Clanker created',
      type: ClankerResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({
      status: 404,
      description: 'Adapter or host not found',
    }),
  ),

  update: applyDecorators(
    ApiOperation({ summary: 'Update a clanker' }),
    ApiParam({ name: 'clankerId', description: 'Clanker UUID', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Clanker updated',
      type: ClankerResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 404, description: 'Clanker not found' }),
  ),

  remove: applyDecorators(
    ApiOperation({ summary: 'Delete a clanker' }),
    ApiParam({ name: 'clankerId', description: 'Clanker UUID', format: 'uuid' }),
    ApiResponse({ status: 204, description: 'Clanker deleted' }),
    ApiResponse({ status: 404, description: 'Clanker not found' }),
  ),
};
