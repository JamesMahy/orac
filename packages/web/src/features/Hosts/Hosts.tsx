import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import type { Host } from '@orac/shared';
import { hostsApi } from '@api/hosts';
import { FolderBrowser } from '@components/FolderBrowser';
import { useHosts, useHostCache } from '@hooks/useHosts';
import { useHostModalStore } from '@stores/hostModalStore';

export function Hosts() {
  const { t } = useTranslation('features', { keyPrefix: 'Hosts' });
  const toast = useRef<Toast>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [browsingHostId, setBrowsingHostId] = useState<string | null>(null);

  const { data: hosts, isLoading } = useHosts();
  const { removeHost } = useHostCache();
  const { openCreateSsh, openCreateApi, openEdit } = useHostModalStore();

  const handleEdit = useCallback(
    (host: Host) => {
      openEdit(host.hostId, host.type);
    },
    [openEdit],
  );

  const handleFolderSelect = useCallback((path: string) => {
    toast.current?.show({
      severity: 'info',
      summary: `Selected: ${path}`,
      life: 3000,
    });
    setBrowsingHostId(null);
  }, []);

  const handleDelete = useCallback(
    (host: Host) => {
      confirmDialog({
        message: t('Are you sure you want to delete this host?', {
          name: host.name,
        }),
        header: t('Delete Host'),
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        accept: async () => {
          try {
            await hostsApi.remove(host.hostId);

            removeHost(host.hostId);

            toast.current?.show({
              severity: 'success',
              summary: t('Host deleted', { name: host.name }),
              life: 3000,
            });
          } catch {
            toast.current?.show({
              severity: 'error',
              summary: t('Failed to delete host', {
                name: host.name,
              }),
              life: 5000,
            });
          }
        },
      });
    },
    [removeHost, t],
  );

  const typeTemplate = (host: Host) => (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        host.type === 'ssh'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-purple-100 text-purple-800'
      }`}>
      {host.type === 'ssh' ? t('SSH') : t('API')}
    </span>
  );

  const hostTargetTemplate = (host: Host) =>
    host.type === 'ssh' ? host.hostname : host.endpoint;

  const dateTemplate = (host: Host) =>
    new Date(host.createdAt).toLocaleDateString();

  const actionsTemplate = (host: Host) => (
    <div className="flex gap-1">
      {host.type === 'ssh' && (
        <Button
          icon="pi pi-folder-open"
          rounded
          text
          severity="secondary"
          aria-label={t('Browse host', { name: host.name })}
          onClick={() => setBrowsingHostId(host.hostId)}
        />
      )}
      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="info"
        aria-label={t('Edit host', { name: host.name })}
        onClick={() => handleEdit(host)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        aria-label={t('Delete host', { name: host.name })}
        onClick={() => handleDelete(host)}
      />
    </div>
  );

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <label htmlFor="host-search" className="sr-only">
          {t('Search hosts by name')}
        </label>
        <InputText
          id="host-search"
          value={globalFilter}
          onChange={event => setGlobalFilter(event.target.value)}
          placeholder={t('Name') + '...'}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button
          label={t('Add SSH Host')}
          icon="pi pi-desktop"
          severity="success"
          onClick={openCreateSsh}
        />
        <Button
          label={t('Add API Host')}
          icon="pi pi-cloud"
          severity="success"
          onClick={openCreateApi}
        />
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-auto p-6" aria-busy={isLoading}>
      <Toast ref={toast} />
      <ConfirmDialog />

      {isLoading && (
        <div className="sr-only" role="status" aria-live="polite">
          {t('Loading hosts')}
        </div>
      )}

      <DataTable
        value={hosts ?? []}
        loading={isLoading}
        header={header}
        globalFilter={globalFilter}
        globalFilterFields={['name']}
        sortField="name"
        sortOrder={1}
        emptyMessage={t('No hosts configured. Add a host to get started.')}
        stripedRows>
        <Column field="name" header={t('Name')} sortable />
        <Column field="type" header={t('Type')} body={typeTemplate} sortable />
        <Column
          header={t('Host / Endpoint')}
          body={hostTargetTemplate}
          sortable
          sortField="hostname"
        />
        <Column
          field="createdAt"
          header={t('Created')}
          body={dateTemplate}
          sortable
        />
        <Column header={t('Actions')} body={actionsTemplate} className="w-32" />
      </DataTable>

      {browsingHostId && (
        <FolderBrowser
          visible={!!browsingHostId}
          hostId={browsingHostId}
          onSelect={handleFolderSelect}
          onClose={() => setBrowsingHostId(null)}
        />
      )}
    </div>
  );
}
