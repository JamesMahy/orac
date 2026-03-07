import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MessagesService } from '../messages.service';
import { PrismaService } from '@database/prisma.service';

const workspaceId = 'ws-uuid-1111-1111-111111111111';
const userId = 'admin';
const clankerId = 'cl-uuid-2222-2222-222222222222';
const attachmentId = 'at-uuid-3333-3333-333333333333';
const messageId = 'msg-uuid-4444-4444-444444444444';

const mockUser = { userId, username: 'Alice', createdAt: new Date() };

const mockAttachment = {
  attachmentId,
  userId,
  workspaceId,
  filename: 'file.txt',
  mimeType: 'text/plain',
  size: 42,
  storageKey: `${workspaceId}/uuid/file.txt`,
  createdAt: new Date(),
};

const mockMessageJoin = {
  messageId,
  attachmentId,
  attachment: mockAttachment,
};

const mockMessage = {
  messageId,
  userId,
  clankerId: null,
  targetClankerId: null,
  senderName: 'Alice',
  workspaceId,
  role: 'user',
  content: 'Hello',
  toolCalls: null,
  rawEvents: null,
  status: 'pending',
  createdAt: new Date(),
  attachments: [mockMessageJoin],
};

describe('MessagesService', () => {
  let service: MessagesService;
  let prisma: {
    user: Record<string, jest.Mock>;
    message: Record<string, jest.Mock>;
    clanker: Record<string, jest.Mock>;
    attachment: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
      },
      message: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      clanker: {
        findUnique: jest.fn(),
      },
      attachment: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  describe('findAll', () => {
    it('should return messages with mapped attachment shape', async () => {
      prisma.message.findMany.mockResolvedValue([mockMessage]);

      const result = await service.findAll(workspaceId, {});

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        include: { attachments: { include: { attachment: true } } },
        orderBy: { messageId: 'desc' },
        take: 51,
      });
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].messageId).toBe(messageId);
      expect(result.messages[0].attachments).toEqual([
        {
          attachmentId: mockAttachment.attachmentId,
          filename: mockAttachment.filename,
          mimeType: mockAttachment.mimeType,
          size: mockAttachment.size,
          storageKey: mockAttachment.storageKey,
          createdAt: mockAttachment.createdAt,
        },
      ]);
    });

    it('should return hasMore: false when results fit within the limit', async () => {
      prisma.message.findMany.mockResolvedValue([mockMessage]);

      const result = await service.findAll(workspaceId, { limit: 10 });

      expect(result.hasMore).toBe(false);
    });

    it('should return hasMore: true and trim the extra row when results exceed the limit', async () => {
      const messages = Array.from({ length: 11 }, (_, index) => ({
        ...mockMessage,
        messageId: `msg-${index}`,
        attachments: [],
      }));
      prisma.message.findMany.mockResolvedValue(messages);

      const result = await service.findAll(workspaceId, { limit: 10 });

      expect(result.hasMore).toBe(true);
      expect(result.messages).toHaveLength(10);
    });

    it('should filter by messageId when before cursor is provided', async () => {
      prisma.message.findMany.mockResolvedValue([]);

      await service.findAll(workspaceId, { before: messageId });

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { workspaceId, messageId: { lt: messageId } },
        include: { attachments: { include: { attachment: true } } },
        orderBy: { messageId: 'desc' },
        take: 51,
      });
    });

    it('should return empty page when no messages exist', async () => {
      prisma.message.findMany.mockResolvedValue([]);

      const result = await service.findAll(workspaceId, {});

      expect(result).toEqual({ messages: [], hasMore: false });
    });
  });

  describe('create', () => {
    it('should create a message without attachments', async () => {
      prisma.message.create.mockResolvedValue({
        ...mockMessage,
        attachments: [],
      });

      const result = await service.create(
        workspaceId,
        { content: 'Hello' },
        userId,
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          userId,
          clankerId: null,
          targetClankerId: null,
          senderName: 'Alice',
          workspaceId,
          role: 'user',
          content: 'Hello',
          attachments: { create: [] },
        },
        include: { attachments: { include: { attachment: true } } },
      });

      expect(result.content).toBe('Hello');
    });

    it('should create a message with attachments', async () => {
      prisma.attachment.findMany.mockResolvedValue([mockAttachment]);
      prisma.message.create.mockResolvedValue(mockMessage);

      const result = await service.create(
        workspaceId,
        { content: 'Hello', attachmentIds: [attachmentId] },
        userId,
      );

      expect(prisma.attachment.findMany).toHaveBeenCalledWith({
        where: { attachmentId: { in: [attachmentId] }, workspaceId, userId },
      });

      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            attachments: { create: [{ attachmentId }] },
          }),
        }),
      );

      expect(result.attachments).toEqual([
        {
          attachmentId: mockAttachment.attachmentId,
          filename: mockAttachment.filename,
          mimeType: mockAttachment.mimeType,
          size: mockAttachment.size,
          storageKey: mockAttachment.storageKey,
          createdAt: mockAttachment.createdAt,
        },
      ]);
    });

    it('should create a message with targetClankerId', async () => {
      const mockClanker = { clankerId };
      prisma.clanker.findUnique.mockResolvedValue(mockClanker);
      prisma.message.create.mockResolvedValue({
        ...mockMessage,
        targetClankerId: clankerId,
        attachments: [],
      });

      const result = await service.create(
        workspaceId,
        { content: 'Hello', targetClankerId: clankerId },
        userId,
      );

      expect(prisma.clanker.findUnique).toHaveBeenCalledWith({
        where: { clankerId },
      });

      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ targetClankerId: clankerId }),
        }),
      );

      expect(result.targetClankerId).toBe(clankerId);
    });

    it('should throw NotFoundException for unknown targetClankerId', async () => {
      prisma.clanker.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          workspaceId,
          { content: 'Hello', targetClankerId: clankerId },
          userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for unknown target clanker', async () => {
      prisma.clanker.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          workspaceId,
          { content: 'Hello', targetClankerId: clankerId },
          userId,
        ),
      ).rejects.toThrow('target_clanker_not_found');
    });

    it('should throw NotFoundException for unknown user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create(workspaceId, { content: 'Hello' }, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for unknown user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create(workspaceId, { content: 'Hello' }, userId),
      ).rejects.toThrow('user_not_found');
    });

    it('should throw NotFoundException when attachment count mismatches', async () => {
      prisma.attachment.findMany.mockResolvedValue([]);

      await expect(
        service.create(
          workspaceId,
          { content: 'Hello', attachmentIds: [attachmentId] },
          userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use snake_case error code for missing attachment', async () => {
      prisma.attachment.findMany.mockResolvedValue([]);

      await expect(
        service.create(
          workspaceId,
          { content: 'Hello', attachmentIds: [attachmentId] },
          userId,
        ),
      ).rejects.toThrow('attachment_not_found');
    });
  });
});
