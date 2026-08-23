import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { PaymentRecord } from '../../types';

export function useMyPayments() {
  return useQuery({
    queryKey: ['payments', 'mine'],
    queryFn: async () => {
      const res = await api.get('/payments/mine');
      return res.data.records as PaymentRecord[];
    },
  });
}

export function usePoolPayments(poolId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'pool', poolId],
    queryFn: async () => {
      const res = await api.get(`/payments/pool/${poolId}`);
      return res.data.records as PaymentRecord[];
    },
    enabled: Boolean(poolId),
  });
}

interface RecordPaymentInput {
  paymentId: string;
  poolId: string;
  listingId?: string;
  buyerWallet: string;
  tokenAddress: string;
  amount: string;
  transactionHash: string;
  ledgerTimestamp: number;
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RecordPaymentInput) => {
      const res = await api.post('/payments', input);
      return res.data.record as PaymentRecord;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      void queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
