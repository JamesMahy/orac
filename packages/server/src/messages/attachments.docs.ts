import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AttachmentContentResponseDto } from './messages.dto';

export const AttachmentsDocs = {
  getContent: applyDecorators(
    ApiOperation({ summary: 'Get attachment content as base64' }),
    ApiParam({
      name: 'attachmentId',
      description: 'Attachment UUID',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'Attachment content',
      type: AttachmentContentResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Invalid attachment ID format' }),
    ApiResponse({ status: 404, description: 'Attachment not found' }),
  ),

  getFile: applyDecorators(
    ApiOperation({ summary: 'Get raw attachment file' }),
    ApiParam({
      name: 'attachmentId',
      description: 'Attachment UUID',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'Raw file with correct Content-Type header',
    }),
    ApiResponse({ status: 400, description: 'Invalid attachment ID format' }),
    ApiResponse({ status: 404, description: 'Attachment not found' }),
  ),
};
