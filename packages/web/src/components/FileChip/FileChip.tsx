import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

type FileChipProps = {
  filename: string;
  icon: string;
  onRemove: () => void;
};

export function FileChip({ filename, icon, onRemove }: FileChipProps) {
  const { t } = useTranslation('features', { keyPrefix: 'WorkspaceChat' });

  const handleRemove = useCallback(() => {
    onRemove();
  }, [onRemove]);

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text-muted">
      <i className={`pi ${icon} text-xs`} aria-hidden="true" />
      <span className="max-w-32 truncate">{filename}</span>
      <button
        type="button"
        onClick={handleRemove}
        className="rounded p-0.5 hover:bg-border/50 hover:text-text focus:outline-none focus:ring-1 focus:ring-primary"
        aria-label={t('Remove attachment', { name: filename })}>
        <i className="pi pi-times text-xs" aria-hidden="true" />
      </button>
    </div>
  );
}
