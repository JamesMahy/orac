export type AdapterType = 'console' | 'api';

export type AdapterSessionStrategy = 'managed' | 'unmanaged';

export type AdapterCapability =
  | 'filesystem'
  | 'code_execution'
  | 'tool_use'
  | 'streaming';

export type AdapterCommand = {
  command: string;
  description: string;
};

export type AdapterField = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select';
  required: boolean;
  secure?: boolean;
  options?: string[];
  default?: string;
  min?: number;
  max?: number;
  step?: number;
};

export type AdapterDefinition = {
  clankerAdapterId: string;
  name: string;
  type: AdapterType;
  command: string | null;
  capabilities: AdapterCapability[];
  commands: AdapterCommand[];
  fields: AdapterField[];
  defaultEndpoint: string | null;
  sessionStrategy: AdapterSessionStrategy;
};

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
};

export type AdapterStreamEvent =
  | { type: 'text_delta'; content: string }
  | { type: 'tool_call_start'; id: string; name: string }
  | { type: 'tool_call_delta'; id: string; input: string }
  | { type: 'tool_call_end'; id: string }
  | { type: 'complete'; sessionId?: string; usage?: TokenUsage }
  | { type: 'error'; message: string; code?: AdapterErrorCode };

export type AdapterErrorCode =
  | 'model_not_found'
  | 'auth_failed'
  | 'rate_limited'
  | 'connection_failed'
  | 'unknown';

export type SendMessageOptions = {
  prompt: string;
  sessionId?: string;
  workspacePath?: string;
};

export type HandleCommandOptions = {
  command: string;
  args?: string;
  sessionId?: string;
  workspacePath?: string;
};
