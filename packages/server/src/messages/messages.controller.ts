import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
import { UserId } from '@common/decorators/user-id.decorator';
import { MessagesService } from './messages.service';
import { AttachmentsService } from './attachments.service';
import {
  CreateMessageDto,
  MessageResponseDto,
  MessagesPageDto,
  MessagesQueryDto,
  AttachmentResponseDto,
} from './messages.dto';
import { MessagesDocs } from './messages.docs';

@ApiTags('Messages')
@ApiCookieAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller('workspaces/:workspaceId')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @Get('messages')
  @MessagesDocs.findAll
  findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: MessagesQueryDto,
  ): Promise<MessagesPageDto> {
    return this.messagesService.findAll(workspaceId, query);
  }

  @Post('messages')
  @MessagesDocs.create
  create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: CreateMessageDto,
    @UserId() userId: string,
  ): Promise<MessageResponseDto> {
    return this.messagesService.create(workspaceId, dto, userId);
  }

  @Post('attachments')
  @MessagesDocs.upload
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  upload(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @UploadedFile() file: Express.Multer.File,
    @UserId() userId: string,
  ): Promise<AttachmentResponseDto> {
    return this.attachmentsService.upload(workspaceId, userId, file);
  }
}
