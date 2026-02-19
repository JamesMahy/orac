import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Toast } from 'primereact/toast';
import type { Workspace } from '@orac/shared';
import { useWorkspaceModalStore } from '@stores/workspaceModalStore';
import { WorkspaceModal } from '../../features/Projects/components/WorkspaceModal';

export function WorkspaceModals() {
  const { t } = useTranslation('features', { keyPrefix: 'Workspaces' });

  const toast = useRef<Toast>(null);
  const queryClient = useQueryClient();

  const { visible, creatingProjectId, editingWorkspace, close } =
    useWorkspaceModalStore();

  const handleComplete = useCallback(
    (workspace: Workspace, isNew: boolean) => {
      queryClient.setQueryData<Workspace[]>(
        ['workspaces', workspace.projectId],
        oldData => {
          if (isNew) {
            return oldData ? [workspace, ...oldData] : [workspace];
          }
          return oldData?.map(existing =>
            existing.workspaceId === workspace.workspaceId ? workspace : existing,
          );
        },
      );

      toast.current?.show({
        severity: 'success',
        summary: isNew
          ? t('Workspace created', { name: workspace.name })
          : t('Workspace updated', { name: workspace.name }),
        life: 3000,
      });

      if (isNew) {
        close();
      }
    },
    [queryClient, close, t],
  );

  return (
    <>
      <Toast ref={toast} />
      <WorkspaceModal
        visible={visible}
        creatingProjectId={creatingProjectId}
        existingWorkspace={editingWorkspace}
        onClose={close}
        onComplete={handleComplete}
      />
    </>
  );
}
