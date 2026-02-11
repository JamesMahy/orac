import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useAuthStore } from '@stores/authStore';
import { useProjectModalStore } from '@stores/projectModalStore';
import { authApi } from '@api/auth';
import { useProjects } from '@hooks/useProjects';

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

  const { data: projects } = useProjects();

  const { openCreate, openEdit } = useProjectModalStore();

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
          {navItems.map(item => {
            if (item.labelKey === 'projects') {
              return (
                <div key={item.to}>
                  <div
                    className={clsx(
                      'flex items-center rounded-lg text-sm font-medium',
                      collapsed ? 'justify-center' : 'gap-0',
                    )}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      title={
                        collapsed ? t(`nav.${item.labelKey}`) : undefined
                      }
                      className={({ isActive }) =>
                        clsx(
                          'flex flex-1 items-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                          collapsed
                            ? 'justify-center px-2 py-2'
                            : 'gap-3 px-3 py-2',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-muted hover:bg-border/50 hover:text-text',
                        )
                      }>
                      <i className={item.icon} aria-hidden="true" />
                      {!collapsed && t(`nav.${item.labelKey}`)}
                    </NavLink>
                    {!collapsed && (
                      <div className="flex">
                        <button
                          onClick={openCreate}
                          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-border/50 hover:text-text focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          aria-label={t('nav.addProject')}>
                          <i
                            className="pi pi-plus text-xs"
                            aria-hidden="true"
                          />
                        </button>
                        <NavLink
                          to="/projects"
                          onClick={onClose}
                          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-border/50 hover:text-text focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          aria-label={t('nav.manageProjects')}>
                          <i
                            className="pi pi-cog text-xs"
                            aria-hidden="true"
                          />
                        </NavLink>
                      </div>
                    )}
                  </div>

                  {!collapsed && projects && projects.length > 0 && (
                    <ul className="mt-1 space-y-0.5 pl-6">
                      {projects.map(project => (
                        <li
                          key={project.id}
                          className="group flex items-center">
                          <NavLink
                            to="/projects"
                            onClick={onClose}
                            className="flex-1 truncate rounded-md px-3 py-1 text-sm text-text-muted transition-colors hover:bg-border/50 hover:text-text">
                            {project.name}
                          </NavLink>
                          <button
                            onClick={() => openEdit(project.id)}
                            className="rounded-lg p-1 text-text-muted opacity-0 transition-opacity hover:bg-border/50 hover:text-text focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 group-hover:opacity-100"
                            aria-label={t('nav.editProject', { name: project.name })}>
                            <i
                              className="pi pi-pencil text-xs"
                              aria-hidden="true"
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                end={item.to === '/'}
                title={collapsed ? t(`nav.${item.labelKey}`) : undefined}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    collapsed
                      ? 'justify-center px-2 py-2'
                      : 'gap-3 px-3 py-2',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted hover:bg-border/50 hover:text-text',
                  )
                }>
                <i className={item.icon} aria-hidden="true" />
                {!collapsed && t(`nav.${item.labelKey}`)}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={() => {
              authApi.logout().finally(() => {
                useAuthStore.getState().logout();
              });
            }}
            className={clsx(
              'flex w-full items-center rounded-lg py-2 text-sm font-medium text-text-muted transition-colors hover:bg-border/50 hover:text-text focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              collapsed ? 'justify-center px-2' : 'gap-3 px-3',
            )}
            aria-label={t('nav.logout')}>
            <i className="pi pi-sign-out text-lg" aria-hidden="true" />
            {!collapsed && t('nav.logout')}
          </button>
          <button
            onClick={onToggleCollapse}
            className={clsx(
              'hidden w-full items-center rounded-lg py-2 text-sm font-medium text-text-muted transition-colors hover:bg-border/50 hover:text-text focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:flex',
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
