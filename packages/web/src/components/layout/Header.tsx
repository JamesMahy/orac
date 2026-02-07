import { useTranslation } from 'react-i18next';

type HeaderProps = {
  onMenuToggle: () => void;
  title: string;
  isSidebarOpen?: boolean;
};

export function Header({ onMenuToggle, title, isSidebarOpen }: HeaderProps) {
  const { t } = useTranslation('common', { keyPrefix: 'nav' });

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
      <button
        className="rounded-lg p-2 text-text-muted hover:bg-border/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:hidden"
        onClick={onMenuToggle}
        aria-label={t('toggleMenu')}
        aria-expanded={isSidebarOpen}
        aria-controls="main-navigation">
        <i className="pi pi-bars text-lg" aria-hidden="true" />
      </button>
      <h1 className="text-lg font-semibold text-text">{title}</h1>
    </header>
  );
}
