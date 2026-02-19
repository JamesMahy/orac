import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import type { Workspace } from '@orac/shared';
import { FormError } from '@components/FormError';
import { FormModal } from '@components/FormModal';
import { FormTextInput } from '@components/TextInput';
import { FormSelect } from '@components/Select';
import { FolderBrowser } from '@components/FolderBrowser';
import { workspacesApi } from '@api/workspaces';
import { useClankers } from '@hooks/useClankers';
import { useHosts } from '@hooks/useHosts';
import { extractErrorCode, translateError } from '@utils/translateError';

type WorkspaceFormData = {
  name: string;
  primaryClankerId: string;
  hostId: string;
  path: string;
  clankerIds: string[];
};

const DEFAULT_VALUES: WorkspaceFormData = {
  name: '',
  primaryClankerId: '',
  hostId: '',
  path: '',
  clankerIds: [],
};

function transformWorkspaceToFormData(workspace: Workspace): WorkspaceFormData {
  return {
    name: workspace.name,
    primaryClankerId: workspace.primaryClankerId ?? '',
    hostId: workspace.hostId ?? '',
    path: workspace.path ?? '',
    clankerIds: workspace.clankers.map(
      workspaceClanker => workspaceClanker.clankerId,
    ),
  };
}

type WorkspaceModalProps = {
  visible: boolean;
  creatingProjectId: string | null;
  existingWorkspace: Workspace | null;
  onClose: () => void;
  onComplete: (workspace: Workspace, isNew: boolean) => void;
};

export function WorkspaceModal({
  visible,
  creatingProjectId,
  existingWorkspace,
  onClose,
  onComplete,
}: WorkspaceModalProps) {
  const { t } = useTranslation('features', { keyPrefix: 'Workspaces' });

  const previousVisibleRef = useRef(false);

  const [folderBrowserVisible, setFolderBrowserVisible] = useState(false);

  const { data: clankers } = useClankers();
  const { data: hosts } = useHosts();

  const isEditing = !!existingWorkspace;

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    watch,
    formState: { isDirty, errors, isSubmitted },
  } = useForm<WorkspaceFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  const hostId = watch('hostId');
  const name = watch('name');

  const selectedHost = useMemo(
    () => hosts?.find(host => host.hostId === hostId),
    [hosts, hostId],
  );

  const clankerOptions = useMemo(
    () =>
      clankers?.map(clanker => ({
        label: clanker.name,
        value: clanker.clankerId,
      })) ?? [],
    [clankers],
  );

  const sshHostOptions = useMemo(
    () =>
      hosts
        ?.filter(host => host.type !== 'api')
        .map(host => ({ label: host.name, value: host.hostId })) ?? [],
    [hosts],
  );

  const saveMutation = useMutation({
    mutationFn: async (data: WorkspaceFormData) => {
      const { name, primaryClankerId, hostId, path, clankerIds } = data;

      if (isEditing) {
        return workspacesApi.update(existingWorkspace.workspaceId, {
          name,
          primaryClankerId: primaryClankerId || undefined,
          hostId: hostId || null,
          path: path || undefined,
        });
      }
      return workspacesApi.create({
        projectId: creatingProjectId!,
        name,
        primaryClankerId,
        hostId: hostId || undefined,
        path: path || undefined,
        clankers:
          clankerIds.length > 0
            ? clankerIds.map(clankerId => ({ clankerId }))
            : undefined,
      });
    },
    onSuccess: response => {
      onComplete(response, !isEditing);
      if (!isEditing) {
        reset(DEFAULT_VALUES);
      } else {
        reset(transformWorkspaceToFormData(response));
      }
    },
    onError: (error: Error) => {
      setError('root.generalError', {
        type: 'manual',
        message: extractErrorCode(error),
      });
    },
  });

  const handleClose = useCallback(() => {
    onClose();
    reset(DEFAULT_VALUES);
  }, [onClose, reset]);

  const handleFormSubmit = useCallback(() => {
    clearErrors();
    handleSubmit(data => saveMutation.mutate(data))();
  }, [clearErrors, handleSubmit, saveMutation]);

  const loadWorkspaceData = useCallback(() => {
    if (!existingWorkspace) {
      reset(DEFAULT_VALUES);
      return;
    }
    reset(transformWorkspaceToFormData(existingWorkspace));
  }, [existingWorkspace, reset]);

  useEffect(() => {
    if (visible && !previousVisibleRef.current) {
      loadWorkspaceData();
    }
    previousVisibleRef.current = visible;
  }, [visible, loadWorkspaceData]);

  const header = isEditing
    ? t('Update Workspace', { name: name || '' })
    : t('Create Workspace');

  return (
    <FormModal
      visible={visible}
      header={header}
      isLoading={false}
      hasUnsavedChanges={isDirty}
      isBusy={saveMutation.isPending}
      isExisting={isEditing}
      onClose={handleClose}
      onReset={loadWorkspaceData}
      onSave={handleFormSubmit}>
      <FormError
        message={translateError(errors?.root?.generalError?.message, t)}
      />

      <FormTextInput
        name="name"
        control={control}
        label={t('Name')}
        error={errors.name?.message}
        showError={isSubmitted}
        showDirtyState={isEditing}
        required
        autoFocus
        rules={{
          required: t('Please give this workspace a name'),
          maxLength: 255,
        }}
      />

      <FormSelect
        name="primaryClankerId"
        control={control}
        label={t('Primary Clanker')}
        options={clankerOptions}
        error={errors.primaryClankerId?.message}
        showError={isSubmitted}
        showDirtyState={isEditing}
        required
        rules={{
          required: t('Please select a primary clanker'),
        }}
      />

      {sshHostOptions.length > 0 ? (
        <FormSelect
          name="hostId"
          control={control}
          label={t('Host')}
          options={[{ label: t('None'), value: '' }, ...sshHostOptions]}
          showDirtyState={isEditing}
        />
      ) : (
        <div className="mb-4 flex flex-col gap-1">
          <span className="text-sm font-medium">{t('Host')}</span>
          <p className="text-sm text-text-muted">
            {t('No filesystem hosts configured')}
          </p>
        </div>
      )}

      {hostId && (
        <Controller
          name="path"
          control={control}
          rules={{ maxLength: 4096 }}
          render={({ field, fieldState }) => (
            <div className="mb-4 flex flex-col gap-1">
              <label htmlFor="workspace-path" className="text-sm font-medium">
                {t('Path')}
                {isEditing && fieldState.isDirty && (
                  <span className="ml-2 text-xs text-primary">(modified)</span>
                )}
              </label>
              <div className="flex gap-2">
                <InputText
                  id="workspace-path"
                  value={field.value}
                  onChange={event => field.onChange(event.target.value)}
                  onBlur={field.onBlur}
                  className="flex-1"
                />
                {selectedHost?.type !== 'api' && (
                  <Button
                    icon="pi pi-folder-open"
                    severity="secondary"
                    outlined
                    type="button"
                    aria-label={t('Browse path')}
                    onClick={() => setFolderBrowserVisible(true)}
                  />
                )}
              </div>
              {fieldState.error && isSubmitted && (
                <small className="text-xs text-red-500">
                  {fieldState.error.message}
                </small>
              )}
              {selectedHost?.type !== 'api' && (
                <FolderBrowser
                  visible={folderBrowserVisible}
                  hostId={hostId}
                  initialPath={field.value || undefined}
                  onSelect={path => {
                    field.onChange(path);
                    setFolderBrowserVisible(false);
                  }}
                  onClose={() => setFolderBrowserVisible(false)}
                />
              )}
            </div>
          )}
        />
      )}

      {!isEditing && (
        <Controller
          name="clankerIds"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                {t('Additional Clankers')}
              </label>
              <MultiSelect
                id="clankerIds"
                value={field.value}
                onChange={event => field.onChange(event.value)}
                options={clankerOptions}
                placeholder={t('None')}
                display="chip"
                className="w-full"
              />
            </div>
          )}
        />
      )}
    </FormModal>
  );
}
