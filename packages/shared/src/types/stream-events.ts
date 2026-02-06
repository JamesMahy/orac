export type StreamChunkEvent = {
  projectId: string;
  content: string;
};

export type StreamStartEvent = {
  projectId: string;
  messageId: string;
};

export type StreamEndEvent = {
  projectId: string;
  messageId: string;
  tokenCount: number;
};

export type StreamErrorEvent = {
  projectId: string;
  error: string;
};
