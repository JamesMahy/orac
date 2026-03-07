import type { Attachment } from './messages';

export type MessageRole = 'user' | 'assistant';

export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

export type Message = {
  messageId: string;
  workspaceId: string;
  userId?: string;
  clankerId?: string;
  targetClankerId?: string;
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
  content: string;
  targetClankerId?: string;
  attachmentIds?: string[];
};

export type MessagesPage = {
  messages: Message[];
  hasMore: boolean;
};
