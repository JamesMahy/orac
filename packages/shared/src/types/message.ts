import type { Attachment } from './messages';

export type MessageRole = 'user' | 'assistant';

export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

export type Message = {
  messageId: string;
  workspaceId: string;
  userId?: string;
  clankerId?: string;
  senderName: string;
  role: string;
  content: string;
  toolCalls: unknown;
  rawEvents: unknown;
  status: string;
  createdAt: Date;
  attachments: Attachment[];
};

export type CreateMessageDto = {
  role: string;
  content: string;
  senderName: string;
  clankerId?: string;
  attachmentIds?: string[];
};

export type MessagesPage = {
  messages: Message[];
  hasMore: boolean;
};
