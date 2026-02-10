import { useTranslation } from 'react-i18next';

import type { BrowseDirectoryResponse } from '@orac/shared';
import { LoadingSpinner } from '@components/LoadingSpinner';

import { DirectoryRow } from './DirectoryRow';

type DirectoryListingProps = {
  isLoading: boolean;
  browseData?: BrowseDirectoryResponse;
  onNavigate: (path: string) => void;
};

export function DirectoryListing({
  isLoading,
  browseData,
  onNavigate,
}: DirectoryListingProps) {
  const { t } = useTranslation('features', { keyPrefix: 'FolderBrowser' });

  return (
    <div
      className="h-80 overflow-y-auto rounded-lg border border-surface-border"
      role="list"
      aria-label="Directory contents">
      {isLoading && <LoadingSpinner isLoading className="h-full" />}

      {!isLoading && browseData && (
        <>
          {browseData.parentPath !== null && (
            <button
              type="button"
              role="listitem"
              aria-label={t('Go to parent directory')}
              className="group flex w-full cursor-pointer items-center gap-3 border-b border-surface-border px-3 py-3 text-left hover:bg-surface-hover"
              onClick={() => onNavigate(browseData.parentPath!)}>
              <i
                className="pi pi-arrow-up text-muted-color"
                aria-hidden="true"
              />
              <span className="group-hover:underline">..</span>
            </button>
          )}

          {browseData.entries.map(entry => (
            <DirectoryRow
              key={entry.name}
              entry={entry}
              onNavigate={onNavigate}
              resolvedPath={browseData.path}
            />
          ))}

          {browseData.entries.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-color">
              {t('This directory is empty')}
            </div>
          )}
        </>
      )}
    </div>
  );
}
