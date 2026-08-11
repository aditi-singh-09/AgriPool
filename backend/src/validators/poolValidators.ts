import { z } from 'zod';

const participantSchema = z.object({
  role: z.enum(['farmer', 'cooperative', 'transport', 'warehouse']),
  walletAddress: z.string().regex(/^G[A-Z2-7]{55}$/, 'walletAddress must be a valid Stellar public key'),
  shareBps: z.number().int().min(1).max(10_000),
  displayName: z.string().min(1).max(120),
});

export const createPoolSchema = z.object({
  body: z.object({
    poolId: z
      .string()
      .min(3)
      .max(32)
      .regex(/^[a-z0-9_]+$/, 'poolId must be lowercase alphanumeric with underscores only'),
    cooperativeName: z.string().min(2).max(120),
    participants: z
      .array(participantSchema)
      .min(1)
      .max(12)
      .refine((list) => list.reduce((sum, p) => sum + p.shareBps, 0) === 10_000, {
        message: 'Participant shares must sum to exactly 10,000 basis points (100%)',
      }),
  }),
});

export const poolIdParamSchema = z.object({
  params: z.object({
    poolId: z.string().min(1),
  }),
});
