import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VaultAdapterDefinitionDto, VaultResponseDto } from './vaults.dto';

export const VaultsDocs = {
  findAllAdapters: applyDecorators(
    ApiOperation({ summary: 'List all vault adapters' }),
    ApiResponse({
      status: 200,
      description: 'List of vault adapter definitions',
      type: [VaultAdapterDefinitionDto],
    }),
  ),

  findAllVaults: applyDecorators(
    ApiOperation({ summary: 'List all configured vaults' }),
    ApiResponse({
      status: 200,
      description: 'List of vaults with secure fields masked',
      type: [VaultResponseDto],
    }),
  ),
};
