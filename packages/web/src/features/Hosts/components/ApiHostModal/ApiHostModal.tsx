import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { Host } from '@orac/shared';
import { FormError } from '@components/FormError';
import { FormModal } from '@components/FormModal';
import { FormTextInput } from '@components/TextInput';
import { FormPasswordInput } from '@components/PasswordInput';
import { hostsApi } from '@api/hosts';
import { extractErrorCode, translateError } from '@utils/translateError';
import type { ApiFormData } from '../../hosts.types';

const DEFAULT_API_VALUES: ApiFormData = {
  name: '',
  type: 'api',
  endpoint: '',
  apiKey: '',
  provider: '',
  model: '',
};

function transformHostToApiFormData(host: Host): ApiFormData {
  return {
    name: host.name,
    type: 'api',
    endpoint: host.endpoint ?? '',
    apiKey: '',
    provider: host.provider ?? '',
    model: host.model ?? '',
  };
}

type ApiHostModalProps = {
  visible: boolean;
  existingHostId?: string | null;
  onClose: () => void;
  onComplete: (host: Host, isNew: boolean) => void;
};

export function ApiHostModal({
  visible,
  existingHostId,
  onClose,
  onComplete,
}: ApiHostModalProps) {
  const { t } = useTranslation('features', { keyPrefix: 'Hosts' });
  const isExistingHost = !!existingHostId;

  const {
    data: hostData,
    isLoading,
    isError,
    error: fetchError,
  } = useQuery({
    queryKey: ['host', existingHostId],
    queryFn: () => hostsApi.getById(existingHostId!),
    enabled: !!existingHostId,
    retry: false,
    staleTime: 0,
  });

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    watch,
    formState: { isDirty, errors, dirtyFields, isSubmitted },
  } = useForm<ApiFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: DEFAULT_API_VALUES,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ApiFormData) => {
      if (isExistingHost) {
        const dirty: Record<string, unknown> = {};
        for (const key of Object.keys(dirtyFields)) {
          dirty[key] = data[key as keyof ApiFormData];
        }
        return hostsApi.update(existingHostId!, dirty);
      }
      return hostsApi.create(data);
    },
    onSuccess: response => {
      reset(transformHostToApiFormData(response));
      onComplete(response, !isExistingHost);
    },
    onError: (mutationError: Error) => {
      setError('root.generalError', {
        type: 'manual',
        message: extractErrorCode(mutationError),
      });
    },
  });

  const handleClose = useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  const handleFormSubmit = useCallback(() => {
    clearErrors();
    handleSubmit(data => saveMutation.mutate(data))();
  }, [clearErrors, handleSubmit, saveMutation]);

  const loadHostData = useCallback(() => {
    if (!hostData) {
      reset(DEFAULT_API_VALUES);
      return;
    }
    reset(transformHostToApiFormData(hostData));
  }, [hostData, reset]);

  useEffect(() => {
    loadHostData();
  }, [loadHostData]);

  const name = watch('name');

  const fetchErrorCode = isError ? extractErrorCode(fetchError) : null;
  const header = isExistingHost
    ? t('Update Host', { name: name || '' })
    : t('Create API Host');

  return (
    <FormModal
      visible={visible}
      header={header}
      isLoading={isLoading}
      errorMessage={translateError(fetchErrorCode, t)}
      hasUnsavedChanges={isDirty}
      isBusy={saveMutation.isPending}
      isExistingHost={isExistingHost}
      onClose={handleClose}
      onReset={loadHostData}
      onSave={handleFormSubmit}>
      <FormError
        message={translateError(
          errors?.root?.generalError?.message,
          t,
        )}
      />

      <FormTextInput
        name="name"
        control={control}
        label={t('Name')}
        error={errors.name?.message}
        showError={isSubmitted}
        showDirtyState={isExistingHost}
        required
        rules={{
          required: t('Please give this host a name'),
          maxLength: 255,
        }}
      />

      <FormTextInput
        name="endpoint"
        control={control}
        label={t('Endpoint')}
        placeholder={t('https://api.example.com/v1')}
        error={errors.endpoint?.message}
        showError={isSubmitted}
        showDirtyState={isExistingHost}
        required
        rules={{
          required: t('Please enter an API endpoint'),
          pattern: {
            value: /^https:\/\/.+/,
            message: t('Must be a valid HTTPS URL'),
          },
          maxLength: 255,
        }}
      />

      <FormPasswordInput
        name="apiKey"
        control={control}
        label={t('API Key')}
        error={errors.apiKey?.message}
        showError={isSubmitted}
        showDirtyState={isExistingHost}
        required
        autoComplete="off"
        rules={{
          required: t('Please enter an API key'),
        }}
      />

      <FormTextInput
        name="provider"
        control={control}
        label={t('Provider')}
        error={errors.provider?.message}
        showError={isSubmitted}
        showDirtyState={isExistingHost}
        required
        rules={{
          required: t('Please enter a provider name'),
          maxLength: 100,
        }}
      />

      <FormTextInput
        name="model"
        control={control}
        label={t('Model')}
        error={errors.model?.message}
        showError={isSubmitted}
        showDirtyState={isExistingHost}
        required
        rules={{
          required: t('Please enter a model name'),
          maxLength: 100,
        }}
      />
    </FormModal>
  );
}
