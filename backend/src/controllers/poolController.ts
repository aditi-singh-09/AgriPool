import type { Request, Response } from 'express';
import { DistributionPool } from '../models/DistributionPool.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sorobanReader } from '../utils/sorobanReader.js';
import { logger } from '../config/logger.js';

/**
 * Registers the off-chain mirror of a pool immediately after the buyer's
 * wallet has signed and submitted the on-chain `create_pool` call. The
 * frontend passes along the same `poolId` used on-chain; this record exists
 * purely so listings/marketplace pages can display cooperative names,
 * participant display names, and search without round-tripping to RPC on
 * every page load. The contract remains the source of truth for shares.
 */
export const createPool = asyncHandler(async (req: Request, res: Response) => {
  const { poolId, cooperativeName, participants } = req.body as {
    poolId: string;
    cooperativeName: string;
    participants: { role: string; walletAddress: string; shareBps: number; displayName: string }[];
  };

  const existing = await DistributionPool.findOne({ poolId });
  if (existing) {
    throw AppError.conflict(`A pool with id "${poolId}" is already registered`);
  }

  const pool = await DistributionPool.create({
    poolId,
    cooperativeName,
    participants,
    createdBy: req.user!.id,
  });

  res.status(201).json({ pool });
});

export const getPool = asyncHandler(async (req: Request, res: Response) => {
  const pool = await DistributionPool.findOne({ poolId: req.params.poolId });
  if (!pool) throw AppError.notFound(`No pool registered with id "${req.params.poolId}"`);
  res.json({ pool });
});

export const listPools = asyncHandler(async (_req: Request, res: Response) => {
  const pools = await DistributionPool.find({ active: true }).sort({ createdAt: -1 });
  res.json({ pools });
});

/**
 * Cross-checks the off-chain mirror against the live contract state.
 * Falls back gracefully if CONTRACT_ID / RPC isn't configured yet (e.g.
 * during early local development before the first testnet deployment).
 */
export const getPoolOnChainState = asyncHandler(async (req: Request, res: Response) => {
  try {
    const [chainPool, history] = await Promise.all([
      sorobanReader.getPool(req.params.poolId),
      sorobanReader.getHistory(req.params.poolId),
    ]);
    res.json({ chainPool, history });
  } catch (err) {
    logger.warn({ err }, 'On-chain read unavailable, contract may not be deployed yet');
    throw AppError.internal('On-chain data is temporarily unavailable');
  }
});
