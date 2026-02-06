export type MessageRole = 'user' | 'assistant';

export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

export type Message = {
  id: string;
  projectId: string;
  role: MessageRole;
  content: string;
  toolCalls: unknown[] | null;
  rawEvents: unknown[] | null;
  status: MessageStatus;
  createdAt: Date;
};

export type CreateMessageDto = {
  projectId: string;
  role: MessageRole;
  content: string;
};
