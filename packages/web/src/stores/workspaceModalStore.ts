import { create } from 'zustand';
import type { Workspace } from '@orac/shared';

type WorkspaceModalState = {
  visible: boolean;
  creatingProjectId: string | null;
  editingWorkspace: Workspace | null;
  openCreate: (projectId: string) => void;
  openEdit: (workspace: Workspace) => void;
  close: () => void;
};

export const useWorkspaceModalStore = create<WorkspaceModalState>()(
  setState => ({
    visible: false,
    creatingProjectId: null,
    editingWorkspace: null,
    openCreate: (projectId: string) => {
      setState({
        visible: true,
        creatingProjectId: projectId,
        editingWorkspace: null,
      });
    },
    openEdit: (workspace: Workspace) => {
      setState({
        visible: true,
        editingWorkspace: workspace,
        creatingProjectId: null,
      });
    },
    close: () => {
      setState({ visible: false });
    },
  }),
);
