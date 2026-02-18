import type { Host, CreateHostDto, UpdateHostDto } from '@orac/shared';
import { api } from './client';

export const hostsApi = {
  getAll: async (): Promise<Host[]> => {
    const { data } = await api.get<Host[]>('/api/hosts');
    return data;
  },

  getById: async (hostId: string): Promise<Host> => {
    const { data } = await api.get<Host>(`/api/hosts/${hostId}`);
    return data;
  },

  create: async (hostData: CreateHostDto): Promise<Host> => {
    const { data } = await api.post<Host>('/api/hosts', hostData);
    return data;
  },

  update: async (hostId: string, hostData: UpdateHostDto): Promise<Host> => {
    const { data } = await api.patch<Host>(
      `/api/hosts/${hostId}`,
      hostData,
    );
    return data;
  },

  remove: async (hostId: string): Promise<void> => {
    await api.delete(`/api/hosts/${hostId}`);
  },
};
