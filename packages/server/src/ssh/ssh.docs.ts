import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  TestConnectionDto,
  TestConnectionResponseDto,
  ConnectionStatusDto,
} from './ssh.dto';

export const SshDocs = {
  testConnection: applyDecorators(
    ApiOperation({ summary: 'Test an SSH connection with provided config' }),
    ApiBody({ type: TestConnectionDto }),
    ApiResponse({
      status: 201,
      description: 'Connection test result',
      type: TestConnectionResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
  ),

  getStatus: applyDecorators(
    ApiOperation({ summary: 'Get connection status for a host' }),
    ApiParam({ name: 'id', description: 'Host UUID', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Connection status',
      type: ConnectionStatusDto,
    }),
    ApiResponse({ status: 404, description: 'Host not found' }),
  ),
};
