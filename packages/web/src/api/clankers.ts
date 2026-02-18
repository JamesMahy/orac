import type {
  Clanker,
  CreateClankerDto,
  UpdateClankerDto,
} from '@orac/shared';
import { api } from './client';

export const clankersApi = {
  getAll: async (): Promise<Clanker[]> => {
    const { data } = await api.get<Clanker[]>('/api/clankers');
    return data;
  },

  getById: async (clankerId: string): Promise<Clanker> => {
    const { data } = await api.get<Clanker>(`/api/clankers/${clankerId}`);
    return data;
  },

  create: async (clankerData: CreateClankerDto): Promise<Clanker> => {
    const { data } = await api.post<Clanker>('/api/clankers', clankerData);
    return data;
  },

  update: async (
    clankerId: string,
    clankerData: UpdateClankerDto,
  ): Promise<Clanker> => {
    const { data } = await api.patch<Clanker>(
      `/api/clankers/${clankerId}`,
      clankerData,
    );
    return data;
  },

  remove: async (clankerId: string): Promise<void> => {
    await api.delete(`/api/clankers/${clankerId}`);
  },
};
