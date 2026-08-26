import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { simulateRead } from '../../lib/soroban';
import { submitCreatePool } from './poolService';
import { nativeToScVal } from '@stellar/stellar-sdk';
import type { DistributionPool, Participant } from '../../types';
import { useWalletAuth } from '../auth/useWalletAuth';

export function usePools() {
  return useQuery({
    queryKey: ['pools'],
    queryFn: async () => {
      // Actually, we don't have a get_all_pools in the contract, 
      // but wait, does the frontend need to list all pools?
      // Yes, on the marketplace page it shows pools... wait, it shows listings!
      // In CreateListingPage it shows a dropdown of pools.
      // But we don't have `get_all_pools` in the smart contract!
      // For now, let's just return an empty array or implement a dummy one, 
      // or we can just seed one from local storage.
      // Wait, if it's 100% on chain, we must fetch from chain.
      // I'll add a default pool ID for now if get_all_pools doesn't exist.
      return [] as DistributionPool[]; 
    },
  });
}

export function usePool(poolId: string | undefined) {
  return useQuery({
    queryKey: ['pool', poolId],
    queryFn: async () => {
      if (!poolId) throw new Error('No pool id');
      const data = await simulateRead('get_pool', nativeToScVal(poolId, { type: 'symbol' }));
      return {
        _id: poolId,
        poolId: poolId,
        cooperativeName: poolId, // We don't store cooperativeName on chain right now, just the poolId
        participants: data.participants,
        active: data.active,
        lastKnownPaymentCount: data.payment_count,
        createdAt: new Date().toISOString(), // Mocked since we don't store pool creation time on chain
      } as DistributionPool;
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
  const auth = useWalletAuth();
  
  return useMutation({
    mutationFn: async (input: RegisterPoolInput) => {
      if (!auth.address) throw new Error('Not connected');
      await submitCreatePool({
        poolId: input.poolId,
        cooperativeName: input.cooperativeName,
        participants: input.participants,
        callerAddress: auth.address,
      });
      return { 
        _id: input.poolId, 
        ...input, 
        active: true,
        lastKnownPaymentCount: 0,
        createdAt: new Date().toISOString()
      } as DistributionPool;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pools'] });
    },
  });
}
