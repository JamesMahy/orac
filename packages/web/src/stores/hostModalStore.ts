import { create } from 'zustand';
import type { HostType } from '@orac/shared';

type HostModalState = {
  visible: boolean;
  modalType: HostType | null;
  editingHostId: string | null;
  openCreateSsh: () => void;
  openCreateApi: () => void;
  openEdit: (hostId: string, hostType: HostType) => void;
  close: () => void;
};

export const useHostModalStore = create<HostModalState>()(setState => ({
  visible: false,
  modalType: null,
  editingHostId: null,
  openCreateSsh: () => {
    setState({ visible: true, modalType: 'ssh', editingHostId: null });
  },
  openCreateApi: () => {
    setState({ visible: true, modalType: 'api', editingHostId: null });
  },
  openEdit: (hostId: string, hostType: HostType) => {
    setState({ visible: true, modalType: hostType, editingHostId: hostId });
  },
  close: () => {
    setState({ visible: false });
  },
}));
