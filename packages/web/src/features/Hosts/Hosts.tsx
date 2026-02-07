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
import { HostFormModal } from './HostFormModal';

export function Hosts() {
  const { t } = useTranslation('features', { keyPrefix: 'Hosts' });
  const toast = useRef<Toast>(null);
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingHostId, setEditingHostId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');

  const { data: hosts, isLoading } = useQuery({
    queryKey: ['hosts'],
    queryFn: hostsApi.getAll,
    staleTime: 0,
  });

  const handleCreate = useCallback(() => {
    setEditingHostId(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((host: Host) => {
    setEditingHostId(host.id);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
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
          ? t('created', { name: host.name })
          : t('updated', { name: host.name }),
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
        message: t('deleteConfirm', { name: host.name }),
        header: t('deleteHost'),
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
              summary: t('deleted', { name: host.name }),
              life: 3000,
            });
          } catch {
            toast.current?.show({
              severity: 'error',
              summary: t('deleteFailed', { name: host.name }),
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
      {host.type === 'ssh' ? t('ssh') : t('api')}
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
        aria-label={t('editAction', { name: host.name })}
        onClick={() => handleEdit(host)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        aria-label={t('deleteAction', { name: host.name })}
        onClick={() => handleDelete(host)}
      />
    </div>
  );

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <label htmlFor="host-search" className="sr-only">
          {t('searchHosts')}
        </label>
        <InputText
          id="host-search"
          value={globalFilter}
          onChange={event => setGlobalFilter(event.target.value)}
          placeholder={t('name') + '...'}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      <Button
        label={t('addHost')}
        icon="pi pi-plus"
        severity="success"
        onClick={handleCreate}
      />
    </div>
  );

  return (
    <div className="flex-1 overflow-auto p-6" aria-busy={isLoading}>
      <Toast ref={toast} />
      <ConfirmDialog />

      {isLoading && (
        <div className="sr-only" role="status" aria-live="polite">
          {t('loadingHosts')}
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
        emptyMessage={t('empty')}
        stripedRows>
        <Column field="name" header={t('name')} sortable />
        <Column field="type" header={t('type')} body={typeTemplate} sortable />
        <Column
          header={t('hostnameOrEndpoint')}
          body={hostTargetTemplate}
          sortable
          sortField="hostname"
        />
        <Column
          field="createdAt"
          header={t('createdAt')}
          body={dateTemplate}
          sortable
        />
        <Column header={t('actions')} body={actionsTemplate} className="w-32" />
      </DataTable>

      <HostFormModal
        visible={showModal}
        existingHostId={editingHostId}
        onClose={handleCloseModal}
        onComplete={handleComplete}
      />
    </div>
  );
}
