import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MessagesController } from '../messages.controller';
import { MessagesService } from '../messages.service';
import { AttachmentsService } from '../attachments.service';
import { CreateMessageDto } from '../messages.dto';

const workspaceId = 'ws-uuid-1111-1111-111111111111';
const userId = 'admin';

const mockMessage = {
  messageId: 'msg-uuid-4444-4444-444444444444',
  workspaceId,
  userId,
  clankerId: null,
  senderName: 'Alice',
  role: 'user',
  content: 'Hello',
  toolCalls: null,
  rawEvents: null,
  status: 'pending',
  createdAt: new Date(),
  attachments: [],
};

const mockPage = { messages: [mockMessage], hasMore: false };

const mockUploadResult = {
  attachmentId: 'at-uuid-3333-3333-333333333333',
  filename: 'file.txt',
  mimeType: 'text/plain',
  size: 42,
  storageKey: `${workspaceId}/uuid/file.txt`,
  createdAt: new Date(),
};

describe('MessagesController', () => {
  let controller: MessagesController;
  let mockMessagesService: Record<string, jest.Mock>;
  let mockAttachmentsService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockMessagesService = {
      findAll: jest.fn(),
      create: jest.fn(),
    };

    mockAttachmentsService = {
      upload: jest.fn(),
      getContent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: AttachmentsService, useValue: mockAttachmentsService },
      ],
    }).compile();

    controller = module.get(MessagesController);
  });

  describe('GET /workspaces/:workspaceId/messages', () => {
    it('should call findAll with workspaceId and query', async () => {
      const query = { limit: 10, before: 'msg-uuid-4444-4444-444444444444' };
      mockMessagesService.findAll.mockResolvedValue(mockPage);

      const result = await controller.findAll(workspaceId, query);

      expect(mockMessagesService.findAll).toHaveBeenCalledWith(
        workspaceId,
        query,
      );
      expect(result).toEqual(mockPage);
    });

    it('should pass empty query when no params provided', async () => {
      mockMessagesService.findAll.mockResolvedValue(mockPage);

      await controller.findAll(workspaceId, {});

      expect(mockMessagesService.findAll).toHaveBeenCalledWith(workspaceId, {});
    });
  });

  describe('POST /workspaces/:workspaceId/messages', () => {
    it('should call create with workspaceId, dto, and userId', async () => {
      const dto: CreateMessageDto = {
        content: 'Hello',
      };

      mockMessagesService.create.mockResolvedValue(mockMessage);

      const result = await controller.create(workspaceId, dto, userId);

      expect(mockMessagesService.create).toHaveBeenCalledWith(
        workspaceId,
        dto,
        userId,
      );
      expect(result).toEqual(mockMessage);
    });

    it('should propagate NotFoundException from service', async () => {
      mockMessagesService.create.mockRejectedValue(
        new NotFoundException('clanker_not_found'),
      );

      await expect(
        controller.create(
          workspaceId,
          { content: 'Hi' },
          userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('POST /workspaces/:workspaceId/attachments', () => {
    it('should call upload with workspaceId, userId, and file', async () => {
      const mockFile = {
        originalname: 'file.txt',
        buffer: Buffer.from('hello'),
        mimetype: 'text/plain',
        size: 5,
      } as Express.Multer.File;

      mockAttachmentsService.upload.mockResolvedValue(mockUploadResult);

      const result = await controller.upload(workspaceId, mockFile, userId);

      expect(mockAttachmentsService.upload).toHaveBeenCalledWith(
        workspaceId,
        userId,
        mockFile,
      );
      expect(result).toEqual(mockUploadResult);
    });

    it('should propagate errors from attachments service', async () => {
      const mockFile = {
        originalname: 'file.txt',
        buffer: Buffer.from('hello'),
        mimetype: 'text/plain',
        size: 5,
      } as Express.Multer.File;

      mockAttachmentsService.upload.mockRejectedValue(
        new Error('storage_error'),
      );

      await expect(
        controller.upload(workspaceId, mockFile, userId),
      ).rejects.toThrow('storage_error');
    });
  });
});
