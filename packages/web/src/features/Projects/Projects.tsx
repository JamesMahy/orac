import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import type { Project, Workspace } from '@orac/shared';
import { projectsApi } from '@api/projects';
import { workspacesApi } from '@api/workspaces';
import { useProjects, useProjectCache } from '@hooks/useProjects';
import { useWorkspaces, useWorkspaceCache } from '@hooks/useWorkspaces';
import { useProjectModalStore } from '@stores/projectModalStore';
import { useWorkspaceModalStore } from '@stores/workspaceModalStore';

type WorkspacesPanel = {
  projectId: string;
  projectName: string;
};

export function Projects() {
  const { t } = useTranslation('features', { keyPrefix: 'Projects' });
  const { t: tWorkspaces } = useTranslation('features', {
    keyPrefix: 'Workspaces',
  });
  const toast = useRef<Toast>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [workspacesPanel, setWorkspacesPanel] =
    useState<WorkspacesPanel | null>(null);

  const { openCreate, openEdit } = useProjectModalStore();
  const { removeProject } = useProjectCache();
  const {
    openCreate: openCreateWorkspace,
    openEdit: openEditWorkspace,
  } = useWorkspaceModalStore();

  const { data: projects, isLoading } = useProjects();
  const { data: workspaces, isLoading: isLoadingWorkspaces } = useWorkspaces(
    workspacesPanel?.projectId ?? null,
  );
  const { removeWorkspace } = useWorkspaceCache(
    workspacesPanel?.projectId ?? '',
  );

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

  const handleDeleteWorkspace = useCallback(
    (workspace: Workspace) => {
      confirmDialog({
        message: tWorkspaces('Are you sure you want to delete this workspace?', {
          name: workspace.name,
        }),
        header: tWorkspaces('Delete Workspace'),
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        accept: async () => {
          try {
            await workspacesApi.remove(workspace.workspaceId);
            removeWorkspace(workspace.workspaceId);
            toast.current?.show({
              severity: 'success',
              summary: tWorkspaces('Workspace deleted', { name: workspace.name }),
              life: 3000,
            });
          } catch {
            toast.current?.show({
              severity: 'error',
              summary: tWorkspaces('Failed to delete workspace', {
                name: workspace.name,
              }),
              life: 5000,
            });
          }
        },
      });
    },
    [removeWorkspace, tWorkspaces],
  );

  const handleOpenWorkspacesPanel = useCallback(
    (project: Project) => {
      setWorkspacesPanel({
        projectId: project.projectId,
        projectName: project.name,
      });
    },
    [],
  );

  const handleCloseWorkspacesPanel = useCallback(() => {
    setWorkspacesPanel(null);
  }, []);

  const handleAddWorkspace = useCallback(() => {
    if (workspacesPanel) {
      openCreateWorkspace(workspacesPanel.projectId);
    }
  }, [workspacesPanel, openCreateWorkspace]);

  const descriptionTemplate = (project: Project) => {
    if (!project.description) return null;
    return project.description.length > 100
      ? project.description.slice(0, 100) + '...'
      : project.description;
  };

  const dateTemplate = (project: Project) =>
    new Date(project.createdAt).toLocaleDateString();

  const actionsTemplate = useCallback(
    (project: Project) => (
      <div className="flex gap-1">
        <Button
          icon="pi pi-folder-open"
          rounded
          text
          severity="secondary"
          aria-label={tWorkspaces('Workspaces for project', {
            name: project.name,
          })}
          onClick={() => handleOpenWorkspacesPanel(project)}
        />
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
    ),
    [handleDelete, handleOpenWorkspacesPanel, openEdit, t, tWorkspaces],
  );

  const workspaceActionsTemplate = useCallback(
    (workspace: Workspace) => (
      <div className="flex gap-1">
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="info"
          aria-label={tWorkspaces('Edit workspace', { name: workspace.name })}
          onClick={() => openEditWorkspace(workspace)}
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          aria-label={tWorkspaces('Delete workspace', { name: workspace.name })}
          onClick={() => handleDeleteWorkspace(workspace)}
        />
      </div>
    ),
    [handleDeleteWorkspace, openEditWorkspace, tWorkspaces],
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

  const workspacesPanelFooter = (
    <Button
      label={tWorkspaces('Add Workspace')}
      icon="pi pi-plus"
      severity="success"
      onClick={handleAddWorkspace}
    />
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
        <Column header={t('Actions')} body={actionsTemplate} className="w-40" />
      </DataTable>

      <Dialog
        visible={!!workspacesPanel}
        header={tWorkspaces('Workspaces for project', {
          name: workspacesPanel?.projectName ?? '',
        })}
        footer={workspacesPanelFooter}
        className="w-150"
        onHide={handleCloseWorkspacesPanel}>
        {isLoadingWorkspaces && (
          <div className="sr-only" role="status" aria-live="polite">
            {tWorkspaces('Loading workspaces')}
          </div>
        )}
        <DataTable
          value={workspaces ?? []}
          loading={isLoadingWorkspaces}
          emptyMessage={tWorkspaces(
            'No workspaces yet. Create a workspace to get started.',
          )}
          stripedRows>
          <Column field="name" header={tWorkspaces('Name')} />
          <Column
            field="primaryClanker.name"
            header={tWorkspaces('Primary Clanker')}
          />
          <Column
            header={tWorkspaces('Actions')}
            body={workspaceActionsTemplate}
            className="w-28"
          />
        </DataTable>
      </Dialog>
    </div>
  );
}
