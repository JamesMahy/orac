export type HostType = 'ssh' | 'api';

export type Host = {
  id: string;
  name: string;
  type: HostType;

  // SSH fields
  hostname: string | null;
  port: number | null;
  username: string | null;

  // API fields
  endpoint: string | null;
  provider: string | null;
  model: string | null;

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
