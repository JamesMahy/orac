import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { Header } from '@components/layout/Header';
import type { LayoutContext } from '@components/layout/AppLayout';
import { Chat } from '@features/Chat';

export function ChatRoute() {
  const { t } = useTranslation();
  const { onMenuToggle, sidebarOpen } = useOutletContext<LayoutContext>();

  return (
    <>
      <Header
        onMenuToggle={onMenuToggle}
        title={t('nav.chat')}
        isSidebarOpen={sidebarOpen}
      />
      <Chat />
    </>
  );
}
