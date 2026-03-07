import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { UserId } from '@common/decorators/user-id.decorator';
import { AttachmentsService } from './attachments.service';
import { AttachmentContentResponseDto } from './messages.dto';
import { AttachmentsDocs } from './attachments.docs';

@ApiTags('Attachments')
@ApiCookieAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get(':attachmentId/content')
  @AttachmentsDocs.getContent
  getContent(
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @UserId() userId: string,
  ): Promise<AttachmentContentResponseDto> {
    return this.attachmentsService.getContent(attachmentId, userId);
  }

  @Get(':attachmentId/file')
  async redirectToFile(
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @UserId() userId: string,
    @Res() response: Response,
  ) {
    const file = await this.attachmentsService.getFile(attachmentId, userId);
    const encodedFilename = encodeURIComponent(file.filename);
    response.redirect(
      302,
      `/api/attachments/${attachmentId}/file/${encodedFilename}`,
    );
  }

  @Get(':attachmentId/file/:filename')
  @AttachmentsDocs.getFile
  async getFile(
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @UserId() userId: string,
    @Res() response: Response,
  ) {
    const file = await this.attachmentsService.getFile(attachmentId, userId);

    response.setHeader('Content-Type', file.mimeType);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${file.filename}"`,
    );
    response.send(file.buffer);
  }
}
