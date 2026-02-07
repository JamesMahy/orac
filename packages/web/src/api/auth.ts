import { api } from './client';

export const authApi = {
  login: async (): Promise<{ authenticated: boolean }> => {
    const { data } = await api.get<{ authenticated: boolean }>(
      '/api/auth/login',
    );
    return data;
  },
};
