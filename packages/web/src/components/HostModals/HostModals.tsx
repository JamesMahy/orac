import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Toast } from 'primereact/toast';
import type { Host } from '@orac/shared';
import { useHostModalStore } from '@stores/hostModalStore';
import { useHostCache } from '@hooks/useHosts';
import { SshHostModal } from '../../features/Hosts/components/SshHostModal/SshHostModal';
import { ApiHostModal } from '../../features/Hosts/components/ApiHostModal/ApiHostModal';

export function HostModals() {
  const { t } = useTranslation('features', { keyPrefix: 'Hosts' });

  const toast = useRef<Toast>(null);

  const { visible, modalType, editingHostId, close } = useHostModalStore();
  const { addHost, updateHost } = useHostCache();

  const handleComplete = useCallback(
    (host: Host, isNew: boolean) => {
      if (isNew) {
        addHost(host);
      } else {
        updateHost(host);
      }

      toast.current?.show({
        severity: 'success',
        summary: isNew
          ? t('Host created', { name: host.name })
          : t('Host updated', { name: host.name }),
        life: 3000,
      });

      if (isNew) {
        close();
      }
    },
    [addHost, updateHost, close, t],
  );

  return (
    <>
      <Toast ref={toast} />
      <SshHostModal
        visible={visible && modalType === 'ssh'}
        existingHostId={editingHostId}
        onClose={close}
        onComplete={handleComplete}
      />
      <ApiHostModal
        visible={visible && modalType === 'api'}
        existingHostId={editingHostId}
        onClose={close}
        onComplete={handleComplete}
      />
    </>
  );
}
