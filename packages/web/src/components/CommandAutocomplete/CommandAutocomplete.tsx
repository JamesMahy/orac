import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdapterCommand } from '@orac/shared';

type CommandAutocompleteProps = {
  filter: string;
  commands: AdapterCommand[];
  onSelect: (command: AdapterCommand) => void;
  onDismiss: () => void;
};

export function CommandAutocomplete({
  filter,
  commands,
  onSelect,
  onDismiss,
}: CommandAutocompleteProps) {
  const { t } = useTranslation('features', { keyPrefix: 'WorkspaceChat' });
  const listRef = useRef<HTMLUListElement>(null);

  const matches = commands.filter(command =>
    command.command.toLowerCase().startsWith(filter.toLowerCase()),
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onDismiss();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  if (matches.length === 0) return null;

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-1 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
      role="dialog"
      aria-label={t('Commands')}>
      <p className="border-b border-border px-3 py-2 text-xs font-medium text-text-muted">
        {t('Commands')}
      </p>
      <ul ref={listRef} role="listbox" className="max-h-48 overflow-y-auto py-1">
        {matches.map(command => (
          <li key={command.command} role="option" aria-selected={false}>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text transition-colors hover:bg-border/50 focus:bg-border/50 focus:outline-none"
              onClick={() => onSelect(command)}>
              <span className="font-medium">/{command.command}</span>
              <span className="text-xs text-text-muted">
                {command.description}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
