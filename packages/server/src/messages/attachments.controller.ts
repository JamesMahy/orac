import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
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
}
