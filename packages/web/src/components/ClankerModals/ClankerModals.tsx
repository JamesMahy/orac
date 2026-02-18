import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Toast } from 'primereact/toast';
import type { Clanker } from '@orac/shared';
import { useClankerModalStore } from '@stores/clankerModalStore';
import { useClankerCache } from '@hooks/useClankers';
import { ClankerModal } from '../../features/Clankers/components/ClankerModal/ClankerModal';

export function ClankerModals() {
  const { t } = useTranslation('features', { keyPrefix: 'Clankers' });

  const toast = useRef<Toast>(null);

  const { visible, editingClankerId, close } = useClankerModalStore();
  const { addClanker, updateClanker } = useClankerCache();

  const handleComplete = useCallback(
    (clanker: Clanker, isNew: boolean) => {
      if (isNew) {
        addClanker(clanker);
      } else {
        updateClanker(clanker);
      }

      toast.current?.show({
        severity: 'success',
        summary: isNew
          ? t('Clanker created', { name: clanker.name })
          : t('Clanker updated', { name: clanker.name }),
        life: 3000,
      });

      if (isNew) {
        close();
      }
    },
    [addClanker, updateClanker, close, t],
  );

  return (
    <>
      <Toast ref={toast} />
      <ClankerModal
        visible={visible}
        existingClankerId={editingClankerId}
        onClose={close}
        onComplete={handleComplete}
      />
    </>
  );
}
