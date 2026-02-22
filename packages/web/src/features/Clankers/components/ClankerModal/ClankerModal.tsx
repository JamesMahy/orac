import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import type { Clanker, AdapterField } from '@orac/shared';
import { FormError } from '@components/FormError';
import { FormModal } from '@components/FormModal';
import { FormTextInput } from '@components/TextInput';
import { FormPasswordInput } from '@components/PasswordInput';
import { FormTextArea } from '@components/TextArea';
import { FormSelect } from '@components/Select';
import { clankersApi } from '@api/clankers';
import { useAdapters } from '@hooks/useAdapters';
import { useHosts } from '@hooks/useHosts';
import { useClanker } from '@hooks/useClankers';
import { extractErrorCode, translateError } from '@utils/translateError';

type ClankerFormData = {
  name: string;
  clankerAdapterId: string;
  hostId: string;
  config: Record<string, string>;
};

const DEFAULT_VALUES: ClankerFormData = {
  name: '',
  clankerAdapterId: '',
  hostId: '',
  config: {},
};

type ClankerModalProps = {
  visible: boolean;
  existingClankerId: string | null;
  onClose: () => void;
  onComplete: (clanker: Clanker, isNew: boolean) => void;
};

function transformClankerToFormData(
  clanker: Clanker,
  fields: AdapterField[],
): ClankerFormData {
  const config: Record<string, string> = {};
  for (const field of fields) {
    const value = clanker.config[field.key];
    if (field.secure && value === true) {
      config[field.key] = '';
    } else {
      config[field.key] = value != null ? String(value) : '';
    }
  }
  return {
    name: clanker.name,
    clankerAdapterId: clanker.adapter.clankerAdapterId,
    hostId: clanker.host?.hostId ?? '',
    config,
  };
}

export function ClankerModal({
  visible,
  existingClankerId,
  onClose,
  onComplete,
}: ClankerModalProps) {
  const { t } = useTranslation('features', { keyPrefix: 'Clankers' });

  const previousEditingIdRef = useRef<string | null>(null);
  const secureFieldsSetRef = useRef<Set<string>>(new Set());

  const { data: adapters } = useAdapters();
  const { data: hosts } = useHosts();

  const isEditing = !!existingClankerId;

  const {
    data: clankerData,
    isLoading,
    isError,
    error: fetchError,
  } = useClanker(existingClankerId);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    watch,
    formState: { isDirty, errors, dirtyFields, isSubmitted },
  } = useForm<ClankerFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  const clankerAdapterId = watch('clankerAdapterId');
  const name = watch('name');

  const selectedAdapter = useMemo(
    () => adapters?.find(adapter => adapter.clankerAdapterId === clankerAdapterId),
    [adapters, clankerAdapterId],
  );

  const adapterOptions = useMemo(
    () =>
      adapters?.map(adapter => ({
        label: adapter.name,
        value: adapter.clankerAdapterId,
      })) ?? [],
    [adapters],
  );

  const hostOptions = useMemo(
    () =>
      hosts?.map(host => ({
        label: host.name,
        value: host.hostId,
      })) ?? [],
    [hosts],
  );

  const hostSubtitleMap = useMemo(
    () =>
      new Map(
        hosts?.map(host => [
          host.hostId,
          host.hostname ?? host.endpoint ?? '',
        ]),
      ),
    [hosts],
  );

  const hostItemTemplate = useCallback(
    (option: { label: string; value: string }) => {
      const subtitle = hostSubtitleMap.get(option.value);
      return (
        <div>
          <div>{option.label}</div>
          {subtitle && (
            <div className="text-xs text-text-muted">[{subtitle}]</div>
          )}
        </div>
      );
    },
    [hostSubtitleMap],
  );

  const saveMutation = useMutation({
    mutationFn: async (data: ClankerFormData) => {
      if (isEditing) {
        const dirty: Record<string, unknown> = {};

        if (dirtyFields.name) dirty.name = data.name;
        if (dirtyFields.hostId) dirty.hostId = data.hostId || undefined;

        const configDirtyFields = dirtyFields.config;
        if (configDirtyFields && selectedAdapter) {
          const config: Record<string, unknown> = {};
          let hasConfigChanges = false;

          for (const field of selectedAdapter.fields) {
            if (field.secure) {
              if (
                configDirtyFields[
                  field.key as keyof typeof configDirtyFields
                ]
              ) {
                config[field.key] = data.config[field.key];
                hasConfigChanges = true;
              }
            } else {
              config[field.key] = data.config[field.key];
              hasConfigChanges = true;
            }
          }

          if (hasConfigChanges) dirty.config = config;
        }

        return clankersApi.update(existingClankerId!, dirty);
      }

      const config: Record<string, unknown> = {};
      if (selectedAdapter) {
        for (const field of selectedAdapter.fields) {
          const value = data.config[field.key];
          if (value !== '') {
            config[field.key] = value;
          }
        }
      }

      return clankersApi.create({
        name: data.name,
        clankerAdapterId: data.clankerAdapterId,
        hostId: data.hostId || undefined,
        config: Object.keys(config).length > 0 ? config : undefined,
      });
    },
    onSuccess: response => {
      onComplete(response, !isEditing);

      const adapter = resolveAdapter(response.adapter.clankerAdapterId);
      if (isEditing && adapter) {
        secureFieldsSetRef.current = new Set(
          adapter.fields
            .filter(field => field.secure && response.config[field.key] === true)
            .map(field => field.key),
        );
        reset(transformClankerToFormData(response, adapter.fields));
      } else {
        reset(DEFAULT_VALUES);
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
    secureFieldsSetRef.current = new Set();
  }, [onClose, reset]);

  const handleFormSubmit = useCallback(() => {
    clearErrors();
    handleSubmit(data => saveMutation.mutate(data))();
  }, [clearErrors, handleSubmit, saveMutation]);

  const resolveAdapter = useCallback(
    (clankerAdapterId: string) =>
      adapters?.find(adapter => adapter.clankerAdapterId === clankerAdapterId),
    [adapters],
  );

  const loadClankerData = useCallback(() => {
    if (!clankerData) {
      reset(DEFAULT_VALUES);
      return;
    }
    const adapter = resolveAdapter(clankerData.adapter.clankerAdapterId);
    if (!adapter) return;
    secureFieldsSetRef.current = new Set(
      adapter.fields
        .filter(field => field.secure && clankerData.config[field.key] === true)
        .map(field => field.key),
    );
    reset(transformClankerToFormData(clankerData, adapter.fields));
  }, [clankerData, resolveAdapter, reset]);

  useEffect(() => {
    if (visible && existingClankerId && clankerData && adapters) {
      const adapter = resolveAdapter(clankerData.adapter.clankerAdapterId);
      if (!adapter) return;
      secureFieldsSetRef.current = new Set(
        adapter.fields
          .filter(
            field => field.secure && clankerData.config[field.key] === true,
          )
          .map(field => field.key),
      );
      reset(transformClankerToFormData(clankerData, adapter.fields));
    }
  }, [visible, existingClankerId, clankerData, adapters, resolveAdapter, reset]);

  useEffect(() => {
    if (visible && !existingClankerId && previousEditingIdRef.current) {
      reset(DEFAULT_VALUES);
      secureFieldsSetRef.current = new Set();
    }
    previousEditingIdRef.current = existingClankerId;
  }, [visible, existingClankerId, reset]);

  const fetchErrorCode = isError ? extractErrorCode(fetchError) : null;
  const header = isEditing
    ? t('Update Clanker', { name: name || '' })
    : t('Create Clanker');

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
      onReset={loadClankerData}
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
          required: t('Please give this clanker a name'),
          maxLength: 255,
        }}
      />

      <FormSelect
        name="clankerAdapterId"
        control={control}
        label={t('Adapter')}
        options={adapterOptions}
        error={errors.clankerAdapterId?.message}
        showError={isSubmitted}
        required
        disabled={isEditing}
        rules={{
          required: t('Please select an adapter'),
        }}
      />

      {selectedAdapter?.type === 'console' && (
        <FormSelect
          name="hostId"
          control={control}
          label={t('Host')}
          options={hostOptions}
          itemTemplate={hostItemTemplate}
          error={errors.hostId?.message}
          showError={isSubmitted}
          showDirtyState={isEditing}
          required
          rules={{
            required: t('Please select a host'),
          }}
        />
      )}

      {selectedAdapter?.fields.map(field => (
        <ConfigField
          key={field.key}
          field={field}
          control={control}
          isEditing={isEditing}
          isSubmitted={isSubmitted}
          isSecureFieldSet={secureFieldsSetRef.current.has(field.key)}
          t={t}
          configErrors={errors.config}
        />
      ))}
    </FormModal>
  );
}

type ConfigFieldProps = {
  field: AdapterField;
  control: ReturnType<typeof useForm<ClankerFormData>>['control'];
  isEditing: boolean;
  isSubmitted: boolean;
  isSecureFieldSet: boolean;
  t: ReturnType<typeof useTranslation>['t'];
  configErrors?: Record<string, { message?: string } | undefined>;
};

function ConfigField({
  field,
  control,
  isEditing,
  isSubmitted,
  isSecureFieldSet,
  t,
  configErrors,
}: ConfigFieldProps) {
  const fieldName =
    `config.${field.key}` as `config.${string}`;
  const error = configErrors?.[field.key]?.message;
  const placeholder = isEditing && isSecureFieldSet ? t('Unchanged') : undefined;

  const rules = {
    ...(field.required &&
      !isSecureFieldSet && {
        required: t('error-field_required', { field: field.label }),
      }),
    ...(field.type === 'number' && {
      ...(field.min != null && { min: { value: field.min, message: t('error-field_invalid', { field: field.label }) } }),
      ...(field.max != null && { max: { value: field.max, message: t('error-field_invalid', { field: field.label }) } }),
    }),
  };

  if (field.type === 'select' && field.options) {
    const options = field.options.map(option => ({
      label: option,
      value: option,
    }));

    return (
      <FormSelect
        name={fieldName}
        control={control}
        label={field.label}
        options={options}
        error={error}
        showError={isSubmitted}
        showDirtyState={isEditing}
        required={field.required}
        rules={rules}
      />
    );
  }

  if (field.type === 'textarea') {
    return (
      <FormTextArea
        name={fieldName}
        control={control}
        label={field.label}
        placeholder={placeholder}
        error={error}
        showError={isSubmitted}
        showDirtyState={isEditing}
        required={field.required && !isSecureFieldSet}
        rules={rules}
      />
    );
  }

  if (field.secure) {
    return (
      <FormPasswordInput
        name={fieldName}
        control={control}
        label={field.label}
        placeholder={placeholder}
        error={error}
        showError={isSubmitted}
        showDirtyState={isEditing}
        required={field.required && !isSecureFieldSet}
        rules={rules}
      />
    );
  }

  return (
    <FormTextInput
      name={fieldName}
      control={control}
      label={field.label}
      placeholder={placeholder}
      error={error}
      showError={isSubmitted}
      showDirtyState={isEditing}
      required={field.required && !isSecureFieldSet}
      type={field.type === 'number' ? 'number' : 'text'}
      rules={rules}
    />
  );
}
