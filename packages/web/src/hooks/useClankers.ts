import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { Clanker } from '@orac/shared';
import { clankersApi } from '@api/clankers';

const keys = {
  all: ['clankers'] as const,
  detail: (clankerId: string) => ['clanker', clankerId] as const,
};

export function useClankers() {
  return useQuery({
    queryKey: keys.all,
    queryFn: clankersApi.getAll,
    staleTime: 0,
  });
}

export function useClanker(clankerId: string | null) {
  return useQuery({
    queryKey: keys.detail(clankerId!),
    queryFn: () => clankersApi.getById(clankerId!),
    enabled: !!clankerId,
    retry: false,
    staleTime: 0,
  });
}

export function useClankerCache() {
  const queryClient = useQueryClient();

  const addClanker = useCallback(
    (clanker: Clanker) => {
      queryClient.setQueryData<Clanker[]>(keys.all, oldData =>
        oldData ? [clanker, ...oldData] : [clanker],
      );
    },
    [queryClient],
  );

  const updateClanker = useCallback(
    (clanker: Clanker) => {
      queryClient.setQueryData<Clanker[]>(keys.all, oldData =>
        oldData?.map(existing =>
          existing.clankerId === clanker.clankerId ? clanker : existing,
        ),
      );
      queryClient.setQueryData(keys.detail(clanker.clankerId), clanker);
    },
    [queryClient],
  );

  const removeClanker = useCallback(
    (clankerId: string) => {
      queryClient.setQueryData<Clanker[]>(keys.all, oldData =>
        oldData?.filter(existing => existing.clankerId !== clankerId),
      );
    },
    [queryClient],
  );

  return { addClanker, updateClanker, removeClanker };
}
