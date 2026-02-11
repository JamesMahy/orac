import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HostModals } from '@components/HostModals';
import { ProjectModal } from '@components/ProjectModal';
import { Sidebar } from './Sidebar';

export type LayoutContext = {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
};

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { t } = useTranslation('common', { keyPrefix: 'a11y' });

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-primary-dark">
        {t('skipToMain')}
      </a>

      <ProjectModal />
      <HostModals />

      <div className="flex h-screen bg-surface">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(previous => !previous)}
        />

        <main
          id="main-content"
          className="flex flex-1 flex-col overflow-hidden">
          <Outlet
            context={
              {
                onMenuToggle: () => setSidebarOpen(previous => !previous),
                sidebarOpen,
              } satisfies LayoutContext
            }
          />
        </main>
      </div>
    </>
  );
}
