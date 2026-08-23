import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { DistributionPool, Participant } from '../../types';

export function usePools() {
  return useQuery({
    queryKey: ['pools'],
    queryFn: async () => {
      const res = await api.get('/pools');
      return res.data.pools as DistributionPool[];
    },
  });
}

export function usePool(poolId: string | undefined) {
  return useQuery({
    queryKey: ['pool', poolId],
    queryFn: async () => {
      const res = await api.get(`/pools/${poolId}`);
      return res.data.pool as DistributionPool;
    },
    enabled: Boolean(poolId),
  });
}

interface RegisterPoolInput {
  poolId: string;
  cooperativeName: string;
  participants: Participant[];
}

export function useRegisterPool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegisterPoolInput) => {
      const res = await api.post('/pools', input);
      return res.data.pool as DistributionPool;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pools'] });
    },
  });
}
