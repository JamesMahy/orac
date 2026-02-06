export type MessageRole = 'user' | 'assistant' | 'system';

export type Message = {
  id: string;
  projectId: string;
  role: MessageRole;
  content: string;
  tokenCount: number | null;
  createdAt: Date;
};

export type CreateMessageDto = {
  projectId: string;
  role: MessageRole;
  content: string;
};
