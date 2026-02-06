import { useTranslation } from 'react-i18next';
import { Link, useOutletContext } from 'react-router-dom';
import { Header } from '@components/layout/Header';
import type { LayoutContext } from '@components/layout/AppLayout';

export function NotFoundRoute() {
  const { t } = useTranslation();
  const { onMenuToggle, sidebarOpen } = useOutletContext<LayoutContext>();

  return (
    <>
      <Header
        onMenuToggle={onMenuToggle}
        title={t('notFound.title')}
        isSidebarOpen={sidebarOpen}
      />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-6xl font-bold text-text-muted">404</p>
        <p className="text-text-muted">{t('notFound.message')}</p>
        <Link
          to="/"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          {t('notFound.goHome')}
        </Link>
      </div>
    </>
  );
}
