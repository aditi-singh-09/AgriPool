import { describe, it, expect } from 'vitest';
import { createPoolSchema } from '../src/validators/poolValidators.js';

const wallet = 'G'.padEnd(56, 'A');

describe('createPoolSchema', () => {
  it('accepts participants whose shares sum to exactly 10000 bps', () => {
    const result = createPoolSchema.safeParse({
      body: {
        poolId: 'pool_valley_coop',
        cooperativeName: 'Valley Growers Cooperative',
        participants: [
          { role: 'farmer', walletAddress: wallet, shareBps: 6000, displayName: 'Farmer Group A' },
          { role: 'cooperative', walletAddress: wallet, shareBps: 2000, displayName: 'Valley Coop' },
          { role: 'transport', walletAddress: wallet, shareBps: 1000, displayName: 'Fast Transport' },
          { role: 'warehouse', walletAddress: wallet, shareBps: 1000, displayName: 'Central Warehouse' },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects participants whose shares do not sum to 10000 bps', () => {
    const result = createPoolSchema.safeParse({
      body: {
        poolId: 'pool_bad',
        cooperativeName: 'Bad Coop',
        participants: [
          { role: 'farmer', walletAddress: wallet, shareBps: 5000, displayName: 'Farmer Group A' },
          { role: 'cooperative', walletAddress: wallet, shareBps: 2000, displayName: 'Coop' },
        ],
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid Stellar wallet address', () => {
    const result = createPoolSchema.safeParse({
      body: {
        poolId: 'pool_invalid_wallet',
        cooperativeName: 'Coop',
        participants: [
          { role: 'farmer', walletAddress: 'not-a-wallet', shareBps: 10000, displayName: 'Farmer' },
        ],
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a poolId with disallowed characters', () => {
    const result = createPoolSchema.safeParse({
      body: {
        poolId: 'Pool With Spaces!',
        cooperativeName: 'Coop',
        participants: [
          { role: 'farmer', walletAddress: wallet, shareBps: 10000, displayName: 'Farmer' },
        ],
      },
    });
    expect(result.success).toBe(false);
  });
});
