import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { confirmDialog } from 'primereact/confirmdialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import type { Host } from '@orac/shared';
import { FormError } from '@components/FormError';
import { FormModal } from '@components/FormModal';
import { FormTextInput } from '@components/TextInput';
import { hostsApi } from '@api/hosts';
import { useHost } from '@hooks/useHosts';
import { sshApi } from '@api/ssh';
import { extractErrorCode, translateError } from '@utils/translateError';
import type { SshFormData } from '../../hosts.types';
import { SshPasswordField } from './SshPasswordField';
import { FingerprintMessage } from './FingerprintMessage';

const HOSTNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9._@+-]+$/;

const DEFAULT_SSH_VALUES: SshFormData = {
  name: '',
  type: 'ssh',
  hostname: '',
  username: '',
  password: '',
};

const SSH_CONNECTION_FIELDS = [
  'hostname',
  'port',
  'username',
  'password',
] as const;

function transformHostToSshFormData(host: Host): SshFormData {
  return {
    name: host.name,
    type: 'ssh',
    hostname: host.hostname ?? '',
    port: host.port ?? undefined,
    username: host.username ?? '',
    password: '',
  };
}

type SshHostModalProps = {
  visible: boolean;
  existingHostId?: string | null;
  onClose: () => void;
  onComplete: (host: Host, isNew: boolean) => void;
};

export function SshHostModal({
  visible,
  existingHostId,
  onClose,
  onComplete,
}: SshHostModalProps) {
  const { t } = useTranslation('features', { keyPrefix: 'Hosts' });
  const isExistingHost = !!existingHostId;

  const toast = useRef<Toast>(null);
  const skipConnectionTestRef = useRef(false);
  const acceptedFingerprintRef = useRef<string | null>(null);

  const [connectionTestFailed, setConnectionTestFailed] = useState<
    string | null
  >(null);
  const [testConnectionError, setTestConnectionError] = useState<string | null>(
    null,
  );
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    data: hostData,
    isLoading,
    isError,
    error: fetchError,
  } = useHost(existingHostId ?? null);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    reset,
    getValues,
    setValue,
    formState: { isDirty, errors, dirtyFields, isSubmitted },
  } = useForm<SshFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: DEFAULT_SSH_VALUES,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: SshFormData & { hostKeyFingerprint?: string }) => {
      if (isExistingHost) {
        const dirty: Record<string, unknown> = {};
        for (const key of Object.keys(dirtyFields)) {
          dirty[key] = data[key as keyof SshFormData];
        }
        if (isChangingPassword && !('password' in dirty)) {
          dirty.password = data.password ?? '';
        }
        if (data.hostKeyFingerprint) {
          dirty.hostKeyFingerprint = data.hostKeyFingerprint;
        }
        return hostsApi.update(existingHostId!, dirty);
      }
      return hostsApi.create(data);
    },
    onSuccess: response => {
      setIsChangingPassword(false);
      reset(transformHostToSshFormData(response));
      onComplete(response, !isExistingHost);
    },
    onError: (mutationError: Error) => {
      setError('root.generalError', {
        type: 'manual',
        message: extractErrorCode(mutationError),
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (data: SshFormData) => {
      const useStoredPassword = isExistingHost && !isChangingPassword;
      return sshApi.testConnection({
        hostname: data.hostname,
        port: data.port || undefined,
        username: data.username,
        password: data.password || undefined,
        hostId: useStoredPassword ? existingHostId! : undefined,
      });
    },
  });

  const save = useCallback(
    (data: SshFormData) => {
      const fingerprint = acceptedFingerprintRef.current;
      saveMutation.mutate(
        fingerprint ? { ...data, hostKeyFingerprint: fingerprint } : data,
      );
    },
    [saveMutation],
  );

  const confirmFingerprint = useCallback(
    (fingerprint: string, onAccept: () => void) => {
      if (acceptedFingerprintRef.current === fingerprint) {
        onAccept();
        return;
      }

      const storedFingerprint = hostData?.hostKeyFingerprint;

      if (storedFingerprint === fingerprint) {
        acceptedFingerprintRef.current = fingerprint;
        onAccept();
        return;
      }

      confirmDialog({
        message: (
          <FingerprintMessage
            fingerprint={fingerprint}
            previousFingerprint={storedFingerprint ?? undefined}
          />
        ),
        header: storedFingerprint ? t('Host Key Changed') : t('New Host Key'),
        icon: storedFingerprint ? 'pi pi-exclamation-triangle' : 'pi pi-shield',
        acceptClassName: storedFingerprint
          ? 'p-button-danger'
          : 'p-button-success',
        className: 'max-w-lg',
        accept: () => {
          acceptedFingerprintRef.current = fingerprint;
          onAccept();
        },
      });
    },
    [hostData, t],
  );

  const handleFormSubmit = useCallback(
    async (data: SshFormData) => {
      setConnectionTestFailed(null);

      if (data.port === undefined || data.port === ('' as unknown as number)) {
        delete data.port;
      }

      const shouldTest =
        !skipConnectionTestRef.current &&
        (!isExistingHost ||
          isChangingPassword ||
          SSH_CONNECTION_FIELDS.some(field => field in dirtyFields));

      if (shouldTest) {
        try {
          const result = await testConnectionMutation.mutateAsync(data);
          if (!result.success) {
            setConnectionTestFailed(result.message || 'Connection failed');
            return;
          }
          if (result.fingerprint) {
            confirmFingerprint(result.fingerprint, () => save(data));
            return;
          }
        } catch (error) {
          setConnectionTestFailed(
            (error as Error).message || 'Connection test error',
          );
          return;
        }
      }

      save(data);
    },
    [
      isExistingHost,
      isChangingPassword,
      dirtyFields,
      save,
      testConnectionMutation,
      confirmFingerprint,
    ],
  );

  const handleClose = useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  const handleTestConnection = useCallback(async () => {
    setTestConnectionError(null);
    const data = getValues();
    try {
      const result = await testConnectionMutation.mutateAsync(data);
      if (!result.success) {
        setTestConnectionError(result.message || 'Connection failed');
        return;
      }
      const showSuccess = () => {
        toast.current?.show({
          severity: 'success',
          summary: t('Connection successful'),
          life: 5000,
        });
      };
      if (!result.fingerprint) {
        showSuccess();
        return;
      }
      confirmFingerprint(result.fingerprint, showSuccess);
    } catch (error) {
      setTestConnectionError((error as Error).message || 'Connection failed');
    }
  }, [getValues, testConnectionMutation, confirmFingerprint, t]);

  const loadHostData = useCallback(() => {
    setIsChangingPassword(false);
    if (!hostData) {
      reset(DEFAULT_SSH_VALUES);
      return;
    }
    reset(transformHostToSshFormData(hostData));
  }, [hostData, reset]);

  const saveAnyway = useCallback(() => {
    skipConnectionTestRef.current = true;
    setConnectionTestFailed(null);
    clearErrors();
    handleSubmit(handleFormSubmit)();
  }, [clearErrors, handleSubmit, handleFormSubmit]);

  useEffect(() => {
    loadHostData();
  }, [loadHostData]);

  useEffect(() => {
    const subscription = watch((_, { name: fieldName }) => {
      if (
        fieldName &&
        SSH_CONNECTION_FIELDS.includes(
          fieldName as (typeof SSH_CONNECTION_FIELDS)[number],
        )
      ) {
        setConnectionTestFailed(null);
        acceptedFingerprintRef.current = null;
        skipConnectionTestRef.current = false;
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (visible) {
      setTestConnectionError(null);
    }
  }, [visible]);

  const name = watch('name');
  const fetchErrorCode = isError ? extractErrorCode(fetchError) : null;
  const hasChanges = isDirty || isChangingPassword;
  const isTesting = testConnectionMutation.isPending;
  const isBusy = saveMutation.isPending || isTesting;
  const hasPassword = !!hostData?.hasPassword;
  const header = isExistingHost
    ? t('Update Host', { name: name || '' })
    : t('Create SSH Host');

  return (
    <>
      <Toast ref={toast} />
      <FormModal
        visible={visible}
        header={header}
        isLoading={isLoading}
        errorMessage={translateError(fetchErrorCode, t)}
        hasUnsavedChanges={hasChanges}
        isBusy={isBusy}
        isExisting={isExistingHost}
        onClose={handleClose}
        onReset={loadHostData}
        onSave={
          connectionTestFailed
            ? saveAnyway
            : () => {
                clearErrors();
                handleSubmit(handleFormSubmit)();
              }
        }
        saveLabel={
          connectionTestFailed
            ? t('Save Anyway')
            : isTesting
              ? t('Testing...')
              : undefined
        }
        saveSeverity={connectionTestFailed ? 'warning' : 'success'}
        extraActions={
          <Button
            label={isTesting ? t('Testing...') : t('Test Connection')}
            icon="pi pi-wifi"
            severity="info"
            outlined
            loading={isTesting}
            disabled={isBusy}
            onClick={handleTestConnection}
            type="button"
          />
        }>
        <FormError
          message={translateError(errors?.root?.generalError?.message, t)}
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
          name="hostname"
          control={control}
          label={t('Hostname')}
          error={errors.hostname?.message}
          showError={isSubmitted}
          showDirtyState={isExistingHost}
          required
          rules={{
            required: t('Please enter a hostname'),
            maxLength: 255,
            pattern: {
              value: HOSTNAME_PATTERN,
              message: t(
                'Only letters, numbers, dots, hyphens and underscores allowed',
              ),
            },
          }}
        />

        <FormTextInput
          name="port"
          control={control}
          label={t('Port')}
          type="number"
          placeholder="22"
          error={errors.port?.message}
          showError={isSubmitted}
          showDirtyState={isExistingHost}
          rules={{
            min: {
              value: 1,
              message: t('Port must be between 1 and 65535'),
            },
            max: {
              value: 65535,
              message: t('Port must be between 1 and 65535'),
            },
          }}
        />

        <FormTextInput
          name="username"
          control={control}
          label={t('Username')}
          error={errors.username?.message}
          showError={isSubmitted}
          showDirtyState={isExistingHost}
          required
          autoComplete="off"
          rules={{
            required: t('Please enter a username for this host'),
            maxLength: 255,
            pattern: {
              value: USERNAME_PATTERN,
              message: t(
                'Only letters, numbers, dots, hyphens, underscores, @ and + allowed',
              ),
            },
          }}
        />

        <SshPasswordField
          control={control}
          errors={errors}
          isSubmitted={isSubmitted}
          isExistingHost={isExistingHost}
          hasPassword={hasPassword}
          isChangingPassword={isChangingPassword}
          onChangePassword={() => setIsChangingPassword(true)}
          onRemovePassword={() =>
            setValue('password', '', { shouldDirty: false })
          }
        />

        <FormError
          message={
            connectionTestFailed
              ? `${t('Connection test failed')}: ${connectionTestFailed}`
              : testConnectionError
          }
        />
      </FormModal>
    </>
  );
}
