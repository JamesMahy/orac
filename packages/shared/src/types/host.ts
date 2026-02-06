export type Host = {
  id: string;
  name: string;
  endpoint: string;
  provider: string;
  model: string;
  apiKeyAlias: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateHostDto = {
  name: string;
  endpoint: string;
  provider: string;
  model: string;
  apiKeyAlias: string;
};

export type UpdateHostDto = Partial<CreateHostDto> & {
  isActive?: boolean;
};
