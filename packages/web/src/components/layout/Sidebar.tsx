import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

const navItems = [
  { to: '/', labelKey: 'hosts', icon: 'pi pi-server' },
  { to: '/projects', labelKey: 'projects', icon: 'pi pi-folder' },
  { to: '/chat', labelKey: 'chat', icon: 'pi pi-comments' },
] as const;

export function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { t } = useTranslation('common');
  const sidebarRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
        previousActiveElement.current = null;
      }
      return;
    }

    previousActiveElement.current = document.activeElement as HTMLElement;

    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const focusableElements = sidebar.querySelectorAll<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])',
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    firstFocusable?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        id="main-navigation"
        className={clsx(
          'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-surface md:static md:translate-x-0',
          'transition-all duration-200 motion-reduce:transition-none',
          open ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'md:w-16' : 'w-64',
        )}>
        <div
          className={clsx(
            'flex h-14 items-center border-b border-border',
            collapsed ? 'justify-center px-2' : 'justify-between px-4',
          )}>
          {!collapsed && (
            <span className="text-xl font-bold text-primary">
              {t('app.title')}
            </span>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-border/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:hidden"
            aria-label={t('nav.closeMenu')}>
            <i className="pi pi-times text-lg" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label={t('nav.sidebar')} className="flex-1 space-y-1 p-3">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              end={item.to === '/'}
              title={collapsed ? t(`nav.${item.labelKey}`) : undefined}
              className={({ isActive }) =>
                clsx(
                  'flex items-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-border/50 hover:text-text',
                )
              }>
              <i className={item.icon} aria-hidden="true" />
              {!collapsed && t(`nav.${item.labelKey}`)}
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-border p-3 md:block">
          <button
            onClick={onToggleCollapse}
            className={clsx(
              'flex w-full items-center rounded-lg py-2 text-sm font-medium text-text-muted transition-colors hover:bg-border/50 hover:text-text focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              collapsed ? 'justify-center px-2' : 'gap-3 px-3',
            )}
            aria-label={t(
              collapsed ? 'nav.expandSidebar' : 'nav.collapseSidebar',
            )}>
            <i
              className={clsx(
                'pi text-lg',
                collapsed ? 'pi-angle-double-right' : 'pi-angle-double-left',
              )}
              aria-hidden="true"
            />
            {!collapsed && t('nav.collapseSidebar')}
          </button>
        </div>
      </aside>
    </>
  );
}
