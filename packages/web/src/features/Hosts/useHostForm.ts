import { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { Host } from '@orac/shared';
import { hostsApi } from '@api/hosts';
import type { HostFormData } from './hosts.types';

const DEFAULT_SSH_VALUES: HostFormData = {
  name: '',
  type: 'ssh',
  hostname: '',
  username: '',
  password: '',
};

function transformHostToFormData(host: Host): HostFormData {
  if (host.type === 'api') {
    return {
      name: host.name,
      type: 'api',
      endpoint: host.endpoint ?? '',
      apiKey: '',
      provider: host.provider ?? '',
      model: host.model ?? '',
    };
  }
  return {
    name: host.name,
    type: 'ssh',
    hostname: host.hostname ?? '',
    port: host.port ?? undefined,
    username: host.username ?? '',
    password: '',
  };
}

type UseHostFormOptions = {
  existingHostId?: string | null;
  onComplete: (host: Host, isNew: boolean) => void;
};

export function useHostForm({
  existingHostId,
  onComplete,
}: UseHostFormOptions) {
  const [isSubmitted, setIsSubmitted] = useState(false);
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
    watch,
    reset,
    formState: { isDirty, errors, dirtyFields },
  } = useForm<HostFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: DEFAULT_SSH_VALUES,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: HostFormData) => {
      if (isExistingHost) {
        const dirtyData = buildDirtyFields(data);
        return hostsApi.update(existingHostId!, dirtyData);
      }
      return hostsApi.create(data);
    },
    onSuccess: response => {
      reset(transformHostToFormData(response));
      onComplete(response, !isExistingHost);
    },
    onError: (mutationError: Error) => {
      setError('root.generalError', {
        type: 'manual',
        message: mutationError.message || 'unknown_error',
      });
    },
  });

  const hostType = watch('type');
  const name = watch('name');

  const fetchErrorMessage = useMemo(() => {
    if (!isError || !fetchError) return null;
    return (fetchError as Error).message || 'unknown_error';
  }, [isError, fetchError]);

  const buildDirtyFields = useCallback(
    (data: HostFormData): Record<string, unknown> => {
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(dirtyFields)) {
        result[key] = data[key as keyof HostFormData];
      }
      return result;
    },
    [dirtyFields],
  );

  const onSubmit = useCallback(
    (data: HostFormData) => {
      setIsSubmitted(true);
      saveMutation.mutate(data);
    },
    [saveMutation],
  );

  const onInvalid = useCallback(() => {
    setIsSubmitted(true);
  }, []);

  const loadHostData = useCallback(() => {
    if (!hostData) {
      reset(DEFAULT_SSH_VALUES);
      return;
    }
    reset(transformHostToFormData(hostData));
  }, [hostData, reset]);

  useEffect(() => {
    loadHostData();
  }, [loadHostData]);

  return {
    control,
    handleSubmit,
    clearErrors,
    reset,
    errors,
    isDirty,
    isSaving: saveMutation.isPending,
    isSubmitted,
    isLoading,
    isExistingHost,
    fetchErrorMessage,
    hostType,
    name,
    onSubmit,
    onInvalid,
    loadHostData,
  };
}
