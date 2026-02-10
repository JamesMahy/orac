import type {
  TestConnectionRequest,
  TestConnectionResponse,
  ConnectionStatusResponse,
} from '@orac/shared';
import { api } from './client';

export const sshApi = {
  testConnection: async (
    config: TestConnectionRequest,
  ): Promise<TestConnectionResponse> => {
    const { data } = await api.post<TestConnectionResponse>(
      '/api/hosts/test-connection',
      config,
    );
    return data;
  },

  getStatus: async (hostId: string): Promise<ConnectionStatusResponse> => {
    const { data } = await api.get<ConnectionStatusResponse>(
      `/api/hosts/${hostId}/status`,
    );
    return data;
  },
};
