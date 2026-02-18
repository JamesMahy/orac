import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import type { Clanker } from '@orac/shared';
import { clankersApi } from '@api/clankers';
import { useClankers, useClankerCache } from '@hooks/useClankers';
import { useClankerModalStore } from '@stores/clankerModalStore';

export function Clankers() {
  const { t } = useTranslation('features', { keyPrefix: 'Clankers' });
  const toast = useRef<Toast>(null);

  const [globalFilter, setGlobalFilter] = useState('');

  const { data: clankers, isLoading } = useClankers();
  const { removeClanker } = useClankerCache();
  const { openCreate, openEdit } = useClankerModalStore();

  const handleDelete = useCallback(
    (clanker: Clanker) => {
      confirmDialog({
        message: t('Are you sure you want to delete this clanker?', {
          name: clanker.name,
        }),
        header: t('Delete Clanker'),
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        accept: async () => {
          try {
            await clankersApi.remove(clanker.clankerId);

            removeClanker(clanker.clankerId);

            toast.current?.show({
              severity: 'success',
              summary: t('Clanker deleted', { name: clanker.name }),
              life: 3000,
            });
          } catch {
            toast.current?.show({
              severity: 'error',
              summary: t('Failed to delete clanker', {
                name: clanker.name,
              }),
              life: 5000,
            });
          }
        },
      });
    },
    [removeClanker, t],
  );

  const adapterTemplate = (clanker: Clanker) => clanker.adapter.name;

  const hostTemplate = (clanker: Clanker) =>
    clanker.host ? clanker.host.name : '—';

  const dateTemplate = (clanker: Clanker) =>
    new Date(clanker.createdAt).toLocaleDateString();

  const actionsTemplate = (clanker: Clanker) => (
    <div className="flex gap-1">
      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="info"
        aria-label={t('Edit clanker', { name: clanker.name })}
        onClick={() => openEdit(clanker.clankerId)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        aria-label={t('Delete clanker', { name: clanker.name })}
        onClick={() => handleDelete(clanker)}
      />
    </div>
  );

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <label htmlFor="clanker-search" className="sr-only">
          {t('Search clankers by name')}
        </label>
        <InputText
          id="clanker-search"
          value={globalFilter}
          onChange={event => setGlobalFilter(event.target.value)}
          placeholder={t('Name') + '...'}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      <Button
        label={t('Add Clanker')}
        icon="pi pi-plus"
        severity="success"
        onClick={openCreate}
      />
    </div>
  );

  return (
    <div className="flex-1 overflow-auto p-6" aria-busy={isLoading}>
      <Toast ref={toast} />
      <ConfirmDialog />

      {isLoading && (
        <div className="sr-only" role="status" aria-live="polite">
          {t('Loading clankers')}
        </div>
      )}

      <DataTable
        value={clankers ?? []}
        loading={isLoading}
        header={header}
        globalFilter={globalFilter}
        globalFilterFields={['name']}
        sortField="name"
        sortOrder={1}
        emptyMessage={t(
          'No clankers configured. Add a clanker to get started.',
        )}
        stripedRows>
        <Column field="name" header={t('Name')} sortable />
        <Column
          field="adapter.name"
          header={t('Adapter')}
          body={adapterTemplate}
          sortable
        />
        <Column
          header={t('Host')}
          body={hostTemplate}
          sortable
          sortField="host.name"
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
    </div>
  );
}
