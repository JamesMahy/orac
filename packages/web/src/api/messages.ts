import type { Message, MessagesPage, CreateMessageDto, Attachment } from '@orac/shared';
import { api } from './client';

export type AttachmentContent = {
  attachmentId: string;
  filename: string;
  mimeType: string;
  content: string;
};

export const messagesApi = {
  getMessages: async (
    workspaceId: string,
    params?: { limit?: number; before?: string },
  ): Promise<MessagesPage> => {
    const { data } = await api.get<MessagesPage>(
      `/api/workspaces/${workspaceId}/messages`,
      { params },
    );
    return data;
  },

  createMessage: async (
    workspaceId: string,
    dto: CreateMessageDto,
  ): Promise<Message> => {
    const { data } = await api.post<Message>(
      `/api/workspaces/${workspaceId}/messages`,
      dto,
    );
    return data;
  },

  uploadAttachment: async (
    workspaceId: string,
    file: File,
  ): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<Attachment>(
      `/api/workspaces/${workspaceId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  getAttachmentContent: async (
    attachmentId: string,
  ): Promise<AttachmentContent> => {
    const { data } = await api.get<AttachmentContent>(
      `/api/attachments/${attachmentId}/content`,
    );
    return data;
  },
};
