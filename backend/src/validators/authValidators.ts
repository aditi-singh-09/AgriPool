import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    displayName: z.string().min(2).max(80),
    role: z.enum(['buyer', 'farmer', 'cooperative', 'transport', 'warehouse']),
    walletAddress: z
      .string()
      .regex(/^G[A-Z2-7]{55}$/, 'walletAddress must be a valid Stellar public key')
      .optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
