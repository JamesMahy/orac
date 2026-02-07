import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import type { Host } from '@orac/shared';
import { FormTextInput } from '@components/TextInput';
import { FormSelect } from '@components/Select';
import { FormPasswordInput } from '@components/PasswordInput';
import { useHostForm } from './useHostForm';
import type { HostFormData } from './hosts.types';

type HostFormModalProps = {
  visible: boolean;
  existingHostId?: string | null;
  onClose: () => void;
  onComplete: (host: Host, isNew: boolean) => void;
};

const HOSTNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export function HostFormModal({
  visible,
  existingHostId,
  onClose,
  onComplete,
}: HostFormModalProps) {
  const { t } = useTranslation('features', { keyPrefix: 'Hosts' });

  const typeOptions = [
    { label: t('ssh'), value: 'ssh' },
    { label: t('api'), value: 'api' },
  ];

  const {
    control,
    handleSubmit,
    clearErrors,
    reset,
    errors,
    isDirty,
    isSaving,
    isSubmitted,
    isLoading,
    isExistingHost,
    fetchErrorMessage,
    hostType,
    name,
    onSubmit,
    onInvalid,
    loadHostData,
  } = useHostForm({ existingHostId, onComplete });

  const handleClose = useCallback(() => {
    if (isDirty && !window.confirm(t('unsavedChanges'))) {
      return;
    }
    onClose();
    reset();
  }, [isDirty, onClose, reset, t]);

  const handleFormSubmit = useCallback(() => {
    clearErrors();
    handleSubmit(onSubmit, onInvalid)();
  }, [clearErrors, handleSubmit, onSubmit, onInvalid]);

  const header = isExistingHost
    ? t('editHost', { name: name || '' })
    : t('createHost');

  const footer = (
    <div className="flex items-center justify-between">
      <div>
        {isExistingHost && isDirty && (
          <Button
            label={t('resetForm')}
            onClick={loadHostData}
            severity="warning"
            disabled={isSaving}
            text
          />
        )}
      </div>
      <div className="flex gap-2">
        <Button
          label={isDirty ? t('cancel') : t('close')}
          onClick={handleClose}
          severity="secondary"
          outlined
          disabled={isSaving}
        />
        <Button
          label={t('save')}
          onClick={handleFormSubmit}
          severity="success"
          loading={isSaving}
          disabled={isExistingHost && !isDirty}
        />
      </div>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header={header}
      footer={footer}
      dismissableMask={false}
      className="w-full max-w-lg">
      {isLoading && (
        <div
          className="flex items-center justify-center p-8"
          role="status"
          aria-live="polite">
          <i className="pi pi-spin pi-spinner text-2xl" aria-hidden="true" />
          <span className="sr-only">{t('loading')}</span>
        </div>
      )}

      {fetchErrorMessage && (
        <div
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          role="alert"
          aria-live="assertive">
          <strong>{t('fetchError')}: </strong>
          {fetchErrorMessage}
        </div>
      )}

      {!isLoading && !fetchErrorMessage && (
        <>
          {errors?.root?.generalError?.message && (
            <div
              className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              role="alert"
              aria-live="assertive">
              {errors.root.generalError.message}
            </div>
          )}

          <div className="p-2">
            <FormTextInput<HostFormData>
              name="name"
              control={control}
              label={t('name')}
              error={errors.name?.message}
              showError={isSubmitted}
              showDirtyState={isExistingHost}
              required
              rules={{
                required: t('nameRequired'),
                maxLength: 255,
              }}
            />

            <FormSelect<HostFormData>
              name="type"
              control={control}
              label={t('type')}
              options={typeOptions}
              error={errors.type?.message}
              showError={isSubmitted}
              showDirtyState={isExistingHost}
              required
            />

            {hostType === 'ssh' && (
              <>
                <FormTextInput<HostFormData>
                  name="hostname"
                  control={control}
                  label={t('hostname')}
                  error={
                    'hostname' in errors ? errors.hostname?.message : undefined
                  }
                  showError={isSubmitted}
                  showDirtyState={isExistingHost}
                  required
                  rules={{
                    required: t('hostnameRequired'),
                    maxLength: 255,
                    pattern: {
                      value: HOSTNAME_PATTERN,
                      message: t('hostnameInvalid'),
                    },
                  }}
                />

                <FormTextInput<HostFormData>
                  name="port"
                  control={control}
                  label={t('port')}
                  type="number"
                  error={'port' in errors ? errors.port?.message : undefined}
                  showError={isSubmitted}
                  showDirtyState={isExistingHost}
                  rules={{
                    min: {
                      value: 1,
                      message: t('portRange'),
                    },
                    max: {
                      value: 65535,
                      message: t('portRange'),
                    },
                  }}
                />

                <FormTextInput<HostFormData>
                  name="username"
                  control={control}
                  label={t('username')}
                  error={
                    'username' in errors ? errors.username?.message : undefined
                  }
                  showError={isSubmitted}
                  showDirtyState={isExistingHost}
                  required
                  autoComplete="off"
                  rules={{
                    required: t('sshUsernameRequired'),
                    maxLength: 255,
                    pattern: {
                      value: HOSTNAME_PATTERN,
                      message: t('sshUsernameInvalid'),
                    },
                  }}
                />

                <FormPasswordInput<HostFormData>
                  name="password"
                  control={control}
                  label={t('password')}
                  error={
                    'password' in errors ? errors.password?.message : undefined
                  }
                  showError={isSubmitted}
                  showDirtyState={isExistingHost}
                  required
                  autoComplete="new-password"
                  rules={{
                    required: t('sshPasswordRequired'),
                  }}
                />
              </>
            )}

            {hostType === 'api' && (
              <>
                <FormTextInput<HostFormData>
                  name="endpoint"
                  control={control}
                  label={t('endpoint')}
                  placeholder={t('endpointPlaceholder')}
                  error={
                    'endpoint' in errors ? errors.endpoint?.message : undefined
                  }
                  showError={isSubmitted}
                  showDirtyState={isExistingHost}
                  required
                  rules={{
                    required: t('endpointRequired'),
                    pattern: {
                      value: /^https:\/\/.+/,
                      message: t('endpointInvalid'),
                    },
                    maxLength: 255,
                  }}
                />

                <FormPasswordInput<HostFormData>
                  name="apiKey"
                  control={control}
                  label={t('apiKey')}
                  error={
                    'apiKey' in errors ? errors.apiKey?.message : undefined
                  }
                  showError={isSubmitted}
                  showDirtyState={isExistingHost}
                  required
                  autoComplete="off"
                  rules={{
                    required: t('apiKeyRequired'),
                  }}
                />

                <FormTextInput<HostFormData>
                  name="provider"
                  control={control}
                  label={t('provider')}
                  error={
                    'provider' in errors ? errors.provider?.message : undefined
                  }
                  showError={isSubmitted}
                  showDirtyState={isExistingHost}
                  required
                  rules={{
                    required: t('providerRequired'),
                    maxLength: 100,
                  }}
                />

                <FormTextInput<HostFormData>
                  name="model"
                  control={control}
                  label={t('model')}
                  error={'model' in errors ? errors.model?.message : undefined}
                  showError={isSubmitted}
                  showDirtyState={isExistingHost}
                  required
                  rules={{
                    required: t('modelRequired'),
                    maxLength: 100,
                  }}
                />
              </>
            )}
          </div>
        </>
      )}
    </Dialog>
  );
}
