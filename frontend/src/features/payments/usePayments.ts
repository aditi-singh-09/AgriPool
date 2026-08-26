import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaymentRecord } from '../../types';

export function useMyPayments() {
  return useQuery({
    queryKey: ['payments', 'mine'],
    queryFn: async () => {
      // Since the backend is removed, we mock fetching from localStorage for now.
      const local = localStorage.getItem('agripool_payments');
      if (local) return JSON.parse(local) as PaymentRecord[];
      return [];
    },
  });
}

export function usePoolPayments(poolId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'pool', poolId],
    queryFn: async () => {
      const local = localStorage.getItem('agripool_payments');
      if (!local) return [];
      const records = JSON.parse(local) as PaymentRecord[];
      return records.filter((r: PaymentRecord) => r.poolId === poolId);
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
      const local = localStorage.getItem('agripool_payments');
      const records = local ? JSON.parse(local) as PaymentRecord[] : [];
      const newRecord: PaymentRecord = {
        _id: input.paymentId,
        paymentId: input.paymentId,
        poolId: input.poolId,
        buyerWallet: input.buyerWallet,
        tokenAddress: input.tokenAddress,
        amount: input.amount,
        transactionHash: input.transactionHash,
        ledgerTimestamp: input.ledgerTimestamp,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      records.unshift(newRecord);
      localStorage.setItem('agripool_payments', JSON.stringify(records));
      return newRecord;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      void queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
