import { create } from 'zustand';

type ClankerModalState = {
  visible: boolean;
  editingClankerId: string | null;
  openCreate: () => void;
  openEdit: (clankerId: string) => void;
  close: () => void;
};

export const useClankerModalStore = create<ClankerModalState>()(setState => ({
  visible: false,
  editingClankerId: null,
  openCreate: () => {
    setState({ visible: true, editingClankerId: null });
  },
  openEdit: (clankerId: string) => {
    setState({ visible: true, editingClankerId: clankerId });
  },
  close: () => {
    setState({ visible: false });
  },
}));
