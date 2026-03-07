import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AttachmentsController } from '../attachments.controller';
import { AttachmentsService } from '../attachments.service';

const attachmentId = 'at-uuid-3333-3333-333333333333';
const userId = 'admin';

const mockContentResult = {
  attachmentId,
  filename: 'file.txt',
  mimeType: 'text/plain',
  content: Buffer.from('hello world').toString('base64'),
};

describe('AttachmentsController', () => {
  let controller: AttachmentsController;
  let mockAttachmentsService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockAttachmentsService = {
      getContent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentsController],
      providers: [
        { provide: AttachmentsService, useValue: mockAttachmentsService },
      ],
    }).compile();

    controller = module.get(AttachmentsController);
  });

  describe('GET /attachments/:attachmentId/content', () => {
    it('should call getContent with attachmentId and userId', async () => {
      mockAttachmentsService.getContent.mockResolvedValue(mockContentResult);

      const result = await controller.getContent(attachmentId, userId);

      expect(mockAttachmentsService.getContent).toHaveBeenCalledWith(
        attachmentId,
        userId,
      );
      expect(result).toEqual(mockContentResult);
    });

    it('should propagate NotFoundException from service', async () => {
      mockAttachmentsService.getContent.mockRejectedValue(
        new NotFoundException('attachment_not_found'),
      );

      await expect(
        controller.getContent('nonexistent', userId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
