import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { FormError } from '@components/FormError';

import { sshApi } from '@api/ssh';
import { extractErrorCode, translateError } from '@utils/translateError';

import { Breadcrumbs } from './components/Breadcrumbs';
import { DirectoryListing } from './components/DirectoryListing';

type FolderBrowserProps = {
  visible: boolean;
  hostId: string;
  initialPath?: string;
  onSelect: (path: string) => void;
  onClose: () => void;
};

export function FolderBrowser({
  visible,
  hostId,
  initialPath,
  onSelect,
  onClose,
}: FolderBrowserProps) {
  const { t } = useTranslation('features', { keyPrefix: 'FolderBrowser' });

  const [currentPath, setCurrentPath] = useState<string | undefined>(
    initialPath,
  );

  const {
    data: browseData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['browse', hostId, currentPath],
    queryFn: () => sshApi.browse(hostId, currentPath),
    enabled: visible && !!hostId,
    staleTime: 30_000,
    retry: false,
  });

  const handleNavigate = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  const handleSelect = useCallback(() => {
    if (browseData?.path) {
      onSelect(browseData.path);
    }
  }, [browseData?.path, onSelect]);

  const errorMessage = useMemo(() => {
    if (!error) return undefined;
    return (
      translateError(extractErrorCode(error), t) ??
      t('Failed to browse directory')
    );
  }, [error, t]);

  const breadcrumbs = useMemo(
    () => (browseData?.path ? buildBreadcrumbs(browseData.path) : []),
    [browseData?.path],
  );

  const footer = (
    <div className="flex justify-end gap-2">
      <Button
        label={t('Cancel')}
        onClick={onClose}
        severity="secondary"
        outlined
      />
      <Button
        label={t('Select Folder')}
        onClick={handleSelect}
        severity="success"
        disabled={!browseData?.path}
      />
    </div>
  );

  useEffect(() => {
    if (visible) {
      setCurrentPath(initialPath);
    }
  }, [visible, initialPath]);

  return (
    <Dialog
      visible={visible}
      onHide={onClose}
      header={t('Browse Folders')}
      footer={footer}
      dismissableMask={false}
      className="w-full max-w-2xl">
      <FormError message={errorMessage} />

      {!errorMessage && (
        <div>
          <Breadcrumbs segments={breadcrumbs} onNavigate={handleNavigate} />

          <DirectoryListing
            isLoading={isLoading}
            browseData={browseData}
            onNavigate={handleNavigate}
          />

          <InputText
            value={browseData?.path ?? ''}
            readOnly
            className="mt-3 w-full text-sm"
            aria-label={t('Current path')}
          />
        </div>
      )}
    </Dialog>
  );
}

function buildBreadcrumbs(path: string) {
  const segments: { label: string; path: string }[] = [
    { label: 'root', path: '/' },
  ];

  if (path === '/') return segments;

  const parts = path.split('/').filter(Boolean);
  let accumulated = '';

  for (const part of parts) {
    accumulated += `/${part}`;
    segments.push({ label: part, path: accumulated });
  }

  return segments;
}
