import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import type { Host } from '@orac/shared';
import { hostsApi } from '@api/hosts';
import { SshHostModal } from './components/SshHostModal/SshHostModal';
import { ApiHostModal } from './components/ApiHostModal/ApiHostModal';

export function Hosts() {
  const { t } = useTranslation('features', { keyPrefix: 'Hosts' });
  const toast = useRef<Toast>(null);
  const queryClient = useQueryClient();

  const [activeModal, setActiveModal] = useState<'ssh' | 'api' | null>(
    null,
  );
  const [editingHostId, setEditingHostId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');

  const { data: hosts, isLoading } = useQuery({
    queryKey: ['hosts'],
    queryFn: hostsApi.getAll,
    staleTime: 0,
  });

  const handleCreateSshHost = useCallback(() => {
    setEditingHostId(null);
    setActiveModal('ssh');
  }, []);

  const handleCreateApiHost = useCallback(() => {
    setEditingHostId(null);
    setActiveModal('api');
  }, []);

  const handleEdit = useCallback((host: Host) => {
    setEditingHostId(host.id);
    setActiveModal(host.type);
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
    setEditingHostId(null);
  }, []);

  const handleComplete = useCallback(
    (host: Host, isNew: boolean) => {
      queryClient.setQueryData<Host[]>(['hosts'], oldData => {
        if (!oldData) return [host];
        if (isNew) return [host, ...oldData];
        return oldData.map(existingHost =>
          existingHost.id === host.id ? host : existingHost,
        );
      });

      toast.current?.show({
        severity: 'success',
        summary: isNew
          ? t('Host created', { name: host.name })
          : t('Host updated', { name: host.name }),
        life: 3000,
      });

      if (isNew) {
        handleCloseModal();
      }
    },
    [queryClient, t, handleCloseModal],
  );

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
            await hostsApi.remove(host.id);

            queryClient.setQueryData<Host[]>(['hosts'], oldData =>
              oldData?.filter(existingHost => existingHost.id !== host.id),
            );

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
    [queryClient, t],
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
          onClick={handleCreateSshHost}
        />
        <Button
          label={t('Add API Host')}
          icon="pi pi-cloud"
          severity="success"
          onClick={handleCreateApiHost}
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
        emptyMessage={t(
          'No hosts configured. Add a host to get started.',
        )}
        stripedRows>
        <Column field="name" header={t('Name')} sortable />
        <Column
          field="type"
          header={t('Type')}
          body={typeTemplate}
          sortable
        />
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
        <Column
          header={t('Actions')}
          body={actionsTemplate}
          className="w-32"
        />
      </DataTable>

      <SshHostModal
        visible={activeModal === 'ssh'}
        existingHostId={editingHostId}
        onClose={handleCloseModal}
        onComplete={handleComplete}
      />
      <ApiHostModal
        visible={activeModal === 'api'}
        existingHostId={editingHostId}
        onClose={handleCloseModal}
        onComplete={handleComplete}
      />
    </div>
  );
}
