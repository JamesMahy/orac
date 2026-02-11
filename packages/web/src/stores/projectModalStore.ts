import { create } from 'zustand';

type ProjectModalState = {
  visible: boolean;
  editingProjectId: string | null;
  openCreate: () => void;
  openEdit: (id: string) => void;
  close: () => void;
};

export const useProjectModalStore = create<ProjectModalState>()(setState => ({
  visible: false,
  editingProjectId: null,
  openCreate: () => {
    setState({ visible: true, editingProjectId: null });
  },
  openEdit: (id: string) => {
    setState({ visible: true, editingProjectId: id });
  },
  close: () => {
    setState({ visible: false, editingProjectId: null });
  },
}));
