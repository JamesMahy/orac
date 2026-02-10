export type SshFormData = {
  name: string;
  type: 'ssh';
  hostname: string;
  port?: number;
  username: string;
  password: string;
};

export type ApiFormData = {
  name: string;
  type: 'api';
  endpoint: string;
  apiKey: string;
  provider: string;
  model: string;
};
