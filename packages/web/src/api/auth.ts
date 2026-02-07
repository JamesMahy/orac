import { api } from './client';

export const authApi = {
  login: async (
    username: string,
    password: string,
  ): Promise<{ authenticated: boolean }> => {
    const { data } = await api.post<{ authenticated: boolean }>(
      '/api/auth/login',
      { username, password },
    );
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
  },

  checkSession: async (): Promise<{ authenticated: boolean }> => {
    const { data } = await api.get<{ authenticated: boolean }>(
      '/api/auth/session',
    );
    return data;
  },
};
