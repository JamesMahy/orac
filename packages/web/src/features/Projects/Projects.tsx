import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import type { Project } from '@orac/shared';
import { projectsApi } from '@api/projects';
import { useProjects, useProjectCache } from '@hooks/useProjects';
import { useProjectModalStore } from '@stores/projectModalStore';

export function Projects() {
  const { t } = useTranslation('features', { keyPrefix: 'Projects' });
  const toast = useRef<Toast>(null);

  const [globalFilter, setGlobalFilter] = useState('');

  const { openCreate, openEdit } = useProjectModalStore();
  const { removeProject } = useProjectCache();

  const { data: projects, isLoading } = useProjects();

  const handleDelete = useCallback(
    (project: Project) => {
      confirmDialog({
        message: t('Are you sure you want to delete this project?', {
          name: project.name,
        }),
        header: t('Delete Project'),
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        accept: async () => {
          try {
            await projectsApi.remove(project.projectId);

            removeProject(project.projectId);

            toast.current?.show({
              severity: 'success',
              summary: t('Project deleted', { name: project.name }),
              life: 3000,
            });
          } catch {
            toast.current?.show({
              severity: 'error',
              summary: t('Failed to delete project', {
                name: project.name,
              }),
              life: 5000,
            });
          }
        },
      });
    },
    [removeProject, t],
  );

  const descriptionTemplate = (project: Project) => {
    if (!project.description) return null;
    return project.description.length > 100
      ? project.description.slice(0, 100) + '...'
      : project.description;
  };

  const dateTemplate = (project: Project) =>
    new Date(project.createdAt).toLocaleDateString();

  const actionsTemplate = (project: Project) => (
    <div className="flex gap-1">
      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="info"
        aria-label={t('Edit project', { name: project.name })}
        onClick={() => openEdit(project.projectId)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        aria-label={t('Delete project', { name: project.name })}
        onClick={() => handleDelete(project)}
      />
    </div>
  );

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <label htmlFor="project-search" className="sr-only">
          {t('Search projects by name')}
        </label>
        <InputText
          id="project-search"
          value={globalFilter}
          onChange={event => setGlobalFilter(event.target.value)}
          placeholder={t('Name') + '...'}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      <Button
        label={t('Add Project')}
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
          {t('Loading projects')}
        </div>
      )}

      <DataTable
        value={projects ?? []}
        loading={isLoading}
        header={header}
        globalFilter={globalFilter}
        globalFilterFields={['name']}
        sortField="name"
        sortOrder={1}
        emptyMessage={t('No projects yet. Create a project to get started.')}
        stripedRows>
        <Column field="name" header={t('Name')} sortable />
        <Column
          field="description"
          header={t('Description')}
          body={descriptionTemplate}
        />
        <Column
          field="createdAt"
          header={t('Created')}
          body={dateTemplate}
          sortable
        />
        <Column header={t('Actions')} body={actionsTemplate} className="w-32" />
      </DataTable>
    </div>
  );
}
