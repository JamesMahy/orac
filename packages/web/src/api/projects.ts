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

  getById: async (id: string): Promise<Project> => {
    const { data } = await api.get<Project>(`/api/projects/${id}`);
    return data;
  },

  create: async (projectData: CreateProjectDto): Promise<Project> => {
    const { data } = await api.post<Project>('/api/projects', projectData);
    return data;
  },

  update: async (
    id: string,
    projectData: UpdateProjectDto,
  ): Promise<Project> => {
    const { data } = await api.patch<Project>(
      `/api/projects/${id}`,
      projectData,
    );
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/projects/${id}`);
  },
};
