import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import {
  TestConnectionDto,
  TestConnectionResponseDto,
  ConnectionStatusDto,
  BrowseDirectoryResponseDto,
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
    ApiParam({ name: 'hostId', description: 'Host UUID', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Connection status',
      type: ConnectionStatusDto,
    }),
    ApiResponse({ status: 404, description: 'Host not found' }),
  ),

  browse: applyDecorators(
    ApiOperation({ summary: 'Browse directories on a remote SSH host' }),
    ApiParam({ name: 'hostId', description: 'Host UUID', format: 'uuid' }),
    ApiQuery({
      name: 'path',
      required: false,
      description: 'Absolute path to browse. Defaults to ~',
    }),
    ApiResponse({
      status: 200,
      description: 'Directory listing',
      type: BrowseDirectoryResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Invalid path or host type' }),
    ApiResponse({ status: 404, description: 'Host not found' }),
  ),
};
