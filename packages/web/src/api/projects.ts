import type {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
} from '@orac/shared';
import { api } from './client';

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const { data } = await api.get<Project[]>('/api/projects');
    return data;
  },

  getById: async (projectId: string): Promise<Project> => {
    const { data } = await api.get<Project>(`/api/projects/${projectId}`);
    return data;
  },

  create: async (projectData: CreateProjectDto): Promise<Project> => {
    const { data } = await api.post<Project>('/api/projects', projectData);
    return data;
  },

  update: async (
    projectId: string,
    projectData: UpdateProjectDto,
  ): Promise<Project> => {
    const { data } = await api.patch<Project>(
      `/api/projects/${projectId}`,
      projectData,
    );
    return data;
  },

  remove: async (projectId: string): Promise<void> => {
    await api.delete(`/api/projects/${projectId}`);
  },
};
