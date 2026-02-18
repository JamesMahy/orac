import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { Header } from '@components/layout/Header';
import type { LayoutContext } from '@components/layout/AppLayout';
import { Clankers } from '@features/Clankers';

export function ClankersRoute() {
  const { t } = useTranslation('common', { keyPrefix: 'nav' });
  const { onMenuToggle, sidebarOpen } = useOutletContext<LayoutContext>();

  return (
    <>
      <Header
        onMenuToggle={onMenuToggle}
        title={t('clankers')}
        isSidebarOpen={sidebarOpen}
      />
      <Clankers />
    </>
  );
}
