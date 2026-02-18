import { create } from 'zustand';

type ProjectModalState = {
  visible: boolean;
  editingProjectId: string | null;
  openCreate: () => void;
  openEdit: (projectId: string) => void;
  close: () => void;
};

export const useProjectModalStore = create<ProjectModalState>()(setState => ({
  visible: false,
  editingProjectId: null,
  openCreate: () => {
    setState({ visible: true, editingProjectId: null });
  },
  openEdit: (projectId: string) => {
    setState({ visible: true, editingProjectId: projectId });
  },
  close: () => {
    setState({ visible: false });
  },
}));
