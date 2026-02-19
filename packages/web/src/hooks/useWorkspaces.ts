import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { Workspace } from '@orac/shared';
import { workspacesApi } from '@api/workspaces';

const keys = {
  all: (projectId: string) => ['workspaces', projectId] as const,
  detail: (workspaceId: string) => ['workspace', workspaceId] as const,
};

export function useWorkspaces(projectId: string | null) {
  return useQuery({
    queryKey: keys.all(projectId!),
    queryFn: () => workspacesApi.getAll(projectId!),
    enabled: !!projectId,
    staleTime: 0,
  });
}

export function useWorkspaceCache(projectId: string) {
  const queryClient = useQueryClient();

  const addWorkspace = useCallback(
    (workspace: Workspace) => {
      queryClient.setQueryData<Workspace[]>(keys.all(projectId), oldData =>
        oldData ? [workspace, ...oldData] : [workspace],
      );
    },
    [queryClient, projectId],
  );

  const updateWorkspace = useCallback(
    (workspace: Workspace) => {
      queryClient.setQueryData<Workspace[]>(keys.all(projectId), oldData =>
        oldData?.map(existing =>
          existing.workspaceId === workspace.workspaceId ? workspace : existing,
        ),
      );
      queryClient.setQueryData(keys.detail(workspace.workspaceId), workspace);
    },
    [queryClient, projectId],
  );

  const removeWorkspace = useCallback(
    (workspaceId: string) => {
      queryClient.setQueryData<Workspace[]>(keys.all(projectId), oldData =>
        oldData?.filter(existing => existing.workspaceId !== workspaceId),
      );
    },
    [queryClient, projectId],
  );

  return { addWorkspace, updateWorkspace, removeWorkspace };
}
