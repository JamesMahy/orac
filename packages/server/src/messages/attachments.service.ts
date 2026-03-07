import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { FileService } from '@files/file.service';
import {
  AttachmentResponseDto,
  AttachmentContentResponseDto,
} from './messages.dto';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async upload(
    workspaceId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<AttachmentResponseDto> {
    const storageKey = await this.fileService.upload(
      workspaceId,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    const attachment = await this.prisma.attachment.create({
      data: {
        userId,
        workspaceId,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey,
      },
    });

    return {
      attachmentId: attachment.attachmentId,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size,
      storageKey: attachment.storageKey,
      createdAt: attachment.createdAt,
    };
  }

  async getContent(
    attachmentId: string,
    userId: string,
  ): Promise<AttachmentContentResponseDto> {
    const attachment = await this.prisma.attachment.findFirst({
      where: { attachmentId, userId },
    });
    if (!attachment) throw new NotFoundException('attachment_not_found');

    const buffer = await this.fileService.download(
      attachment.storageKey,
      attachment.workspaceId,
    );

    return {
      attachmentId: attachment.attachmentId,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      content: buffer.toString('base64'),
    };
  }
}
