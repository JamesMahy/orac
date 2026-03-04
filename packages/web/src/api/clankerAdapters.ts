import type { AdapterDefinition } from '@orac/shared';
import { api } from './client';

export const adaptersApi = {
  getAll: async (): Promise<AdapterDefinition[]> => {
    const { data } = await api.get<AdapterDefinition[]>(
      '/api/clanker-adapters',
    );
    return data;
  },
};
