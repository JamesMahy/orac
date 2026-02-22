import { useQuery } from '@tanstack/react-query';
import { adaptersApi } from '@api/clankerAdapters';

export function useAdapters() {
  return useQuery({
    queryKey: ['adapters'],
    queryFn: adaptersApi.getAll,
    staleTime: Infinity,
  });
}
