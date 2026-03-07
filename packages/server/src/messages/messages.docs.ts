import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import {
  AttachmentResponseDto,
  MessageResponseDto,
  MessagesPageDto,
} from './messages.dto';

export const MessagesDocs = {
  findAll: applyDecorators(
    ApiOperation({ summary: 'List messages in a workspace (newest first)' }),
    ApiParam({
      name: 'workspaceId',
      description: 'Workspace UUID',
      format: 'uuid',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Maximum messages to return (1–100, default 50)',
      example: 50,
    }),
    ApiQuery({
      name: 'before',
      required: false,
      type: String,
      description: 'Return messages older than this message ID (cursor)',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'Paginated messages, ordered newest first',
      type: MessagesPageDto,
    }),
    ApiResponse({ status: 400, description: 'Invalid workspace ID or query parameter' }),
    ApiResponse({ status: 404, description: 'Workspace not found' }),
  ),

  create: applyDecorators(
    ApiOperation({ summary: 'Create a message in a workspace' }),
    ApiParam({
      name: 'workspaceId',
      description: 'Workspace UUID',
      format: 'uuid',
    }),
    ApiResponse({
      status: 201,
      description: 'Message created',
      type: MessageResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({
      status: 404,
      description: 'Clanker or attachment not found',
    }),
  ),

  upload: applyDecorators(
    ApiOperation({ summary: 'Upload an attachment to a workspace' }),
    ApiParam({
      name: 'workspaceId',
      description: 'Workspace UUID',
      format: 'uuid',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'File to upload (max 25 MB)',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Attachment uploaded',
      type: AttachmentResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'No file provided or file exceeds size limit',
    }),
    ApiResponse({ status: 404, description: 'Workspace not found' }),
  ),
};
