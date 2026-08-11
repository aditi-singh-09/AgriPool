import { z } from 'zod';

export const recordPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().min(1).max(64),
    poolId: z.string().min(1).max(32),
    listingId: z.string().min(1).optional(),
    buyerWallet: z.string().regex(/^G[A-Z2-7]{55}$/),
    tokenAddress: z.string().regex(/^C[A-Z2-7]{55}$/, 'tokenAddress must be a valid Soroban contract address'),
    amount: z.string().regex(/^\d+$/, 'amount must be a positive integer string (stroops)'),
    transactionHash: z.string().length(64),
    ledgerTimestamp: z.number().int().positive(),
  }),
});

export const feedbackSchema = z.object({
  body: z.object({
    paymentId: z.string().max(64).optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
    category: z.enum(['payment_experience', 'marketplace', 'wallet_connection', 'general']).default('general'),
  }),
});
