import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { Host } from '@orac/shared';
import { hostsApi } from '@api/hosts';

const keys = {
  all: ['hosts'] as const,
  detail: (hostId: string) => ['host', hostId] as const,
};

export function useHosts() {
  return useQuery({
    queryKey: keys.all,
    queryFn: hostsApi.getAll,
    staleTime: 0,
  });
}

export function useHost(hostId: string | null) {
  return useQuery({
    queryKey: keys.detail(hostId!),
    queryFn: () => hostsApi.getById(hostId!),
    enabled: !!hostId,
    retry: false,
    staleTime: 0,
  });
}

export function useHostCache() {
  const queryClient = useQueryClient();

  const addHost = useCallback(
    (host: Host) => {
      queryClient.setQueryData<Host[]>(keys.all, oldData =>
        oldData ? [host, ...oldData] : [host],
      );
    },
    [queryClient],
  );

  const updateHost = useCallback(
    (host: Host) => {
      queryClient.setQueryData<Host[]>(keys.all, oldData =>
        oldData?.map(existing =>
          existing.id === host.id ? host : existing,
        ),
      );
    },
    [queryClient],
  );

  const removeHost = useCallback(
    (hostId: string) => {
      queryClient.setQueryData<Host[]>(keys.all, oldData =>
        oldData?.filter(existing => existing.id !== hostId),
      );
    },
    [queryClient],
  );

  return { addHost, updateHost, removeHost };
}
