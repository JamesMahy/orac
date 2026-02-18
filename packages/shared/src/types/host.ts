export type HostType = 'ssh' | 'api';

export type Host = {
  hostId: string;
  name: string;
  type: HostType;

  // SSH fields
  hostname: string | null;
  port: number | null;
  username: string | null;
  hostKeyFingerprint: string | null;

  // API fields
  endpoint: string | null;
  provider: string | null;
  model: string | null;

  hasPassword: boolean;

  createdAt: Date;
  updatedAt: Date;
};

export type CreateSshHostDto = {
  name: string;
  type: 'ssh';
  hostname: string;
  port?: number;
  username: string;
  password: string;
  hostKeyFingerprint?: string;
};

export type CreateApiHostDto = {
  name: string;
  type: 'api';
  endpoint: string;
  apiKey: string;
  provider: string;
  model: string;
};

export type CreateHostDto = CreateSshHostDto | CreateApiHostDto;

export type UpdateHostDto = Partial<CreateHostDto>;

export type ConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'error';

export type TestConnectionRequest = {
  hostname: string;
  port?: number;
  username: string;
  password?: string;
  hostId?: string;
};

export type TestConnectionResponse = {
  success: boolean;
  message?: string;
  fingerprint?: string;
};

export type ConnectionStatusResponse = {
  hostId: string;
  status: ConnectionStatus;
  message?: string;
};
