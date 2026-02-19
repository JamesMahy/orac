import type {
  Workspace,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
} from '@orac/shared';
import { api } from './client';

export const workspacesApi = {
  getAll: async (projectId: string): Promise<Workspace[]> => {
    const { data } = await api.get<Workspace[]>('/api/workspaces', {
      params: { projectId },
    });
    return data;
  },

  getById: async (workspaceId: string): Promise<Workspace> => {
    const { data } = await api.get<Workspace>(
      `/api/workspaces/${workspaceId}`,
    );
    return data;
  },

  create: async (workspaceData: CreateWorkspaceDto): Promise<Workspace> => {
    const { data } = await api.post<Workspace>('/api/workspaces', workspaceData);
    return data;
  },

  update: async (
    workspaceId: string,
    workspaceData: UpdateWorkspaceDto,
  ): Promise<Workspace> => {
    const { data } = await api.patch<Workspace>(
      `/api/workspaces/${workspaceId}`,
      workspaceData,
    );
    return data;
  },

  remove: async (workspaceId: string): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}`);
  },

  addClanker: async (
    workspaceId: string,
    clankerId: string,
  ): Promise<void> => {
    await api.post(`/api/workspaces/${workspaceId}/clankers`, { clankerId });
  },

  removeClanker: async (
    workspaceId: string,
    clankerId: string,
  ): Promise<void> => {
    await api.delete(
      `/api/workspaces/${workspaceId}/clankers/${clankerId}`,
    );
  },
};
