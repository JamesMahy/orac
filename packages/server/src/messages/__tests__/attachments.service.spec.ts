import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AttachmentsService } from '../attachments.service';
import { PrismaService } from '@database/prisma.service';
import { FileService } from '@files/file.service';

const workspaceId = 'ws-uuid-1111-1111-111111111111';
const userId = 'admin';
const attachmentId = 'at-uuid-3333-3333-333333333333';
const storageKey = `${workspaceId}/uuid/file.txt`;

const mockAttachment = {
  attachmentId,
  userId,
  workspaceId,
  filename: 'file.txt',
  mimeType: 'text/plain',
  size: 42,
  storageKey,
  createdAt: new Date(),
};

describe('AttachmentsService', () => {
  let service: AttachmentsService;
  let prisma: { attachment: Record<string, jest.Mock> };
  let fileService: { upload: jest.Mock; download: jest.Mock };

  beforeEach(async () => {
    prisma = {
      attachment: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    fileService = {
      upload: jest.fn(),
      download: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: FileService, useValue: fileService },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
  });

  describe('upload', () => {
    it('should upload file and create attachment record', async () => {
      const mockFile = {
        originalname: 'file.txt',
        buffer: Buffer.from('hello'),
        mimetype: 'text/plain',
        size: 42,
      } as Express.Multer.File;

      fileService.upload.mockResolvedValue(storageKey);
      prisma.attachment.create.mockResolvedValue(mockAttachment);

      const result = await service.upload(workspaceId, userId, mockFile);

      expect(fileService.upload).toHaveBeenCalledWith(
        workspaceId,
        'file.txt',
        mockFile.buffer,
        'text/plain',
      );
      expect(prisma.attachment.create).toHaveBeenCalledWith({
        data: {
          userId,
          workspaceId,
          filename: 'file.txt',
          mimeType: 'text/plain',
          size: 42,
          storageKey,
        },
      });
      expect(result).toEqual({
        attachmentId: mockAttachment.attachmentId,
        filename: mockAttachment.filename,
        mimeType: mockAttachment.mimeType,
        size: mockAttachment.size,
        storageKey: mockAttachment.storageKey,
        createdAt: mockAttachment.createdAt,
      });
    });

    it('should propagate error when file service upload fails', async () => {
      const mockFile = {
        originalname: 'file.txt',
        buffer: Buffer.from('hello'),
        mimetype: 'text/plain',
        size: 42,
      } as Express.Multer.File;

      fileService.upload.mockRejectedValue(new Error('storage_unavailable'));

      await expect(
        service.upload(workspaceId, userId, mockFile),
      ).rejects.toThrow('storage_unavailable');

      expect(prisma.attachment.create).not.toHaveBeenCalled();
    });
  });

  describe('getContent', () => {
    it('should return base64-encoded file content', async () => {
      const buffer = Buffer.from('hello world');
      prisma.attachment.findFirst.mockResolvedValue(mockAttachment);
      fileService.download.mockResolvedValue(buffer);

      const result = await service.getContent(attachmentId, userId);

      expect(prisma.attachment.findFirst).toHaveBeenCalledWith({
        where: { attachmentId, userId },
      });
      expect(fileService.download).toHaveBeenCalledWith(
        storageKey,
        workspaceId,
      );
      expect(result.content).toBe(buffer.toString('base64'));
      expect(result.filename).toBe('file.txt');
      expect(result.mimeType).toBe('text/plain');
    });

    it('should throw NotFoundException when attachment not found', async () => {
      prisma.attachment.findFirst.mockResolvedValue(null);

      await expect(service.getContent(attachmentId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use snake_case error code for missing attachment', async () => {
      prisma.attachment.findFirst.mockResolvedValue(null);

      await expect(service.getContent(attachmentId, userId)).rejects.toThrow(
        'attachment_not_found',
      );
    });
  });
});
