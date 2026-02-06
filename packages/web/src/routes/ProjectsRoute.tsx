import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { Header } from '@components/layout/Header';
import type { LayoutContext } from '@components/layout/AppLayout';
import { Projects } from '@features/Projects';

export function ProjectsRoute() {
  const { t } = useTranslation();
  const { onMenuToggle, sidebarOpen } = useOutletContext<LayoutContext>();

  return (
    <>
      <Header
        onMenuToggle={onMenuToggle}
        title={t('nav.projects')}
        isSidebarOpen={sidebarOpen}
      />
      <Projects />
    </>
  );
}
