import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AdapterDefinitionDto } from './adapters.dto';

export const AdaptersDocs = {
  findAll: applyDecorators(
    ApiOperation({ summary: 'List all adapters' }),
    ApiResponse({
      status: 200,
      description: 'List of adapter definitions',
      type: [AdapterDefinitionDto],
    }),
  ),

  findOne: applyDecorators(
    ApiOperation({ summary: 'Get an adapter by ID' }),
    ApiParam({
      name: 'adapterId',
      description: 'Adapter slug identifier',
      example: 'claude-code',
    }),
    ApiResponse({
      status: 200,
      description: 'Adapter found',
      type: AdapterDefinitionDto,
    }),
    ApiResponse({ status: 404, description: 'Adapter not found' }),
  ),
};
