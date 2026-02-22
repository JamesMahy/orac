import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ClankerAdapterDefinitionDto } from './clankerAdapters.dto';

export const ClankerAdaptersDocs = {
  findAll: applyDecorators(
    ApiOperation({ summary: 'List all clanker adapters' }),
    ApiResponse({
      status: 200,
      description: 'List of clanker adapter definitions',
      type: [ClankerAdapterDefinitionDto],
    }),
  ),

  findOne: applyDecorators(
    ApiOperation({ summary: 'Get a clanker adapter by ID' }),
    ApiParam({
      name: 'clankerAdapterId',
      description: 'Clanker adapter slug identifier',
      example: 'claude-code',
    }),
    ApiResponse({
      status: 200,
      description: 'Clanker adapter found',
      type: ClankerAdapterDefinitionDto,
    }),
    ApiResponse({ status: 404, description: 'Clanker adapter not found' }),
  ),
};
