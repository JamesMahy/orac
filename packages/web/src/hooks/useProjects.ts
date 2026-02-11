import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { Project } from '@orac/shared';
import { projectsApi } from '@api/projects';

const keys = {
  all: ['projects'] as const,
  detail: (projectId: string) => ['project', projectId] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: keys.all,
    queryFn: projectsApi.getAll,
    staleTime: 0,
  });
}

export function useProject(projectId: string | null) {
  return useQuery({
    queryKey: keys.detail(projectId!),
    queryFn: () => projectsApi.getById(projectId!),
    enabled: !!projectId,
    retry: false,
    staleTime: 0,
  });
}

export function useProjectCache() {
  const queryClient = useQueryClient();

  const addProject = useCallback(
    (project: Project) => {
      queryClient.setQueryData<Project[]>(keys.all, oldData =>
        oldData ? [project, ...oldData] : [project],
      );
    },
    [queryClient],
  );

  const updateProject = useCallback(
    (project: Project) => {
      queryClient.setQueryData<Project[]>(keys.all, oldData =>
        oldData?.map(existing =>
          existing.id === project.id ? project : existing,
        ),
      );
    },
    [queryClient],
  );

  const removeProject = useCallback(
    (projectId: string) => {
      queryClient.setQueryData<Project[]>(keys.all, oldData =>
        oldData?.filter(existing => existing.id !== projectId),
      );
    },
    [queryClient],
  );

  return { addProject, updateProject, removeProject };
}
