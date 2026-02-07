type SshFormData = {
  name: string;
  type: 'ssh';
  hostname: string;
  port?: number;
  username: string;
  password: string;
};

type ApiFormData = {
  name: string;
  type: 'api';
  endpoint: string;
  apiKey: string;
  provider: string;
  model: string;
};

export type HostFormData = SshFormData | ApiFormData;
