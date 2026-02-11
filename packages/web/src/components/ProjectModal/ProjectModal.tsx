import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import type { Project } from '@orac/shared';
import { FormError } from '@components/FormError';
import { FormModal } from '@components/FormModal';
import { FormTextArea } from '@components/TextArea';
import { FormTextInput } from '@components/TextInput';
import { projectsApi } from '@api/projects';
import { useProject, useProjectCache } from '@hooks/useProjects';
import { extractErrorCode, translateError } from '@utils/translateError';
import { useProjectModalStore } from '@stores/projectModalStore';

type ProjectFormData = {
  name: string;
  description: string;
};

const DEFAULT_VALUES: ProjectFormData = {
  name: '',
  description: '',
};

function transformProjectToFormData(project: Project): ProjectFormData {
  return {
    name: project.name,
    description: project.description ?? '',
  };
}

export function ProjectModal() {
  const { t } = useTranslation('features', { keyPrefix: 'Projects' });

  const previousEditingIdRef = useRef<string | null>(null);

  const { visible, editingProjectId, close } = useProjectModalStore();
  const { addProject, updateProject } = useProjectCache();
  const isEditing = !!editingProjectId;

  const {
    data: projectData,
    isLoading,
    isError,
    error: fetchError,
  } = useProject(editingProjectId);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    watch,
    formState: { isDirty, errors, dirtyFields, isSubmitted },
  } = useForm<ProjectFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      if (isEditing) {
        const dirty: Record<string, unknown> = {};
        for (const key of Object.keys(dirtyFields)) {
          dirty[key] = data[key as keyof ProjectFormData];
        }
        return projectsApi.update(editingProjectId!, dirty);
      }
      return projectsApi.create({
        name: data.name,
        description: data.description || undefined,
      });
    },
    onSuccess: response => {
      if (isEditing) {
        updateProject(response);
      } else {
        addProject(response);
      }

      reset(transformProjectToFormData(response));

      if (!isEditing) {
        close();
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
    close();
    reset(DEFAULT_VALUES);
  }, [close, reset]);

  const handleFormSubmit = useCallback(() => {
    clearErrors();
    handleSubmit(data => saveMutation.mutate(data))();
  }, [clearErrors, handleSubmit, saveMutation]);

  const loadProjectData = useCallback(() => {
    if (!projectData) {
      reset(DEFAULT_VALUES);
      return;
    }
    reset(transformProjectToFormData(projectData));
  }, [projectData, reset]);

  useEffect(() => {
    if (visible && editingProjectId && projectData) {
      reset(transformProjectToFormData(projectData));
    }
  }, [visible, editingProjectId, projectData, reset]);

  useEffect(() => {
    if (visible && !editingProjectId && previousEditingIdRef.current) {
      reset(DEFAULT_VALUES);
    }
    previousEditingIdRef.current = editingProjectId;
  }, [visible, editingProjectId, reset]);

  const name = watch('name');
  const fetchErrorCode = isError ? extractErrorCode(fetchError) : null;
  const header = isEditing
    ? t('Update Project', { name: name || '' })
    : t('Create Project');

  return (
    <FormModal
      visible={visible}
      header={header}
      isLoading={isLoading}
      errorMessage={translateError(fetchErrorCode, t)}
      hasUnsavedChanges={isDirty}
      isBusy={saveMutation.isPending}
      isExisting={isEditing}
      onClose={handleClose}
      onReset={loadProjectData}
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
          required: t('Please give this project a name'),
          maxLength: 255,
        }}
      />

      <FormTextArea
        name="description"
        control={control}
        label={t('Description')}
        showDirtyState={isEditing}
        rules={{ maxLength: 2000 }}
      />
    </FormModal>
  );
}
