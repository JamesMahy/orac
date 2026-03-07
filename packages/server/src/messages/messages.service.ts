import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import {
  CreateMessageDto,
  MessageResponseDto,
  MessagesPageDto,
  MessagesQueryDto,
} from './messages.dto';

type MessageWithAttachments = Prisma.MessageGetPayload<{
  include: { attachments: { include: { attachment: true } } };
}>;

const DEFAULT_LIMIT = 50;

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    workspaceId: string,
    query: MessagesQueryDto,
  ): Promise<MessagesPageDto> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const where: Prisma.MessageWhereInput = { workspaceId };

    if (query.before) {
      where.messageId = { lt: query.before };
    }

    const rows = await this.prisma.message.findMany({
      where,
      include: { attachments: { include: { attachment: true } } },
      orderBy: { messageId: 'desc' },
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const messages = rows
      .slice(0, limit)
      .map(message => this.toResponse(message));

    return { messages, hasMore };
  }

  async create(
    workspaceId: string,
    dto: CreateMessageDto,
    userId: string,
  ): Promise<MessageResponseDto> {
    const { role, content, senderName, clankerId, attachmentIds } = dto;

    if (clankerId) {
      const clanker = await this.prisma.clanker.findUnique({
        where: { clankerId },
      });
      if (!clanker) throw new NotFoundException('clanker_not_found');
    }

    if (attachmentIds && attachmentIds.length > 0) {
      const found = await this.prisma.attachment.findMany({
        where: { attachmentId: { in: attachmentIds }, workspaceId, userId },
      });
      if (found.length !== attachmentIds.length) {
        throw new NotFoundException('attachment_not_found');
      }
    }

    const created = await this.prisma.message.create({
      data: {
        userId,
        clankerId: clankerId ?? null,
        senderName,
        workspaceId,
        role,
        content,
        attachments: {
          create: (attachmentIds ?? []).map(attachmentId => ({
            attachmentId,
          })),
        },
      },
      include: { attachments: { include: { attachment: true } } },
    });

    return this.toResponse(created);
  }

  private toResponse(message: MessageWithAttachments): MessageResponseDto {
    return {
      messageId: message.messageId,
      workspaceId: message.workspaceId,
      userId: message.userId,
      clankerId: message.clankerId,
      senderName: message.senderName,
      role: message.role,
      content: message.content,
      toolCalls: message.toolCalls,
      rawEvents: message.rawEvents,
      status: message.status,
      createdAt: message.createdAt,
      attachments: message.attachments.map(join => ({
        attachmentId: join.attachment.attachmentId,
        filename: join.attachment.filename,
        mimeType: join.attachment.mimeType,
        size: join.attachment.size,
        storageKey: join.attachment.storageKey,
        createdAt: join.attachment.createdAt,
      })),
    };
  }
}
