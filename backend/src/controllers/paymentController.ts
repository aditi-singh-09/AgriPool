import type { Request, Response } from 'express';
import { PaymentRecord } from '../models/PaymentRecord.js';
import { Listing } from '../models/Listing.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { track } from '../config/posthog.js';

/**
 * Called by the frontend immediately after a `settle()` transaction is
 * confirmed on testnet. This does NOT move funds or authorize anything —
 * the contract already completed the atomic distribution. This endpoint
 * only indexes the resulting transaction hash + amount so the buyer's
 * dashboard and the public transaction explorer can display it without
 * re-querying Horizon on every render.
 */
export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const existing = await PaymentRecord.findOne({ paymentId: req.body.paymentId });
  if (existing) {
    throw AppError.conflict('This payment has already been recorded');
  }

  const record = await PaymentRecord.create({ ...req.body, buyerId: req.user!.id });

  if (req.body.listingId) {
    await Listing.findByIdAndUpdate(req.body.listingId, { status: 'sold' });
  }

  track(req.user!.id, 'payment_settled', {
    poolId: record.poolId,
    transactionHash: record.transactionHash,
  });

  res.status(201).json({ record });
});

export const getPaymentByTxHash = asyncHandler(async (req: Request, res: Response) => {
  const record = await PaymentRecord.findOne({ transactionHash: req.params.hash });
  if (!record) throw AppError.notFound('No payment found for this transaction hash');
  res.json({ record });
});

export const listPaymentsForPool = asyncHandler(async (req: Request, res: Response) => {
  const records = await PaymentRecord.find({ poolId: req.params.poolId }).sort({ createdAt: -1 });
  res.json({ records });
});

export const listMyPayments = asyncHandler(async (req: Request, res: Response) => {
  const records = await PaymentRecord.find({ buyerId: req.user!.id }).sort({ createdAt: -1 });
  res.json({ records });
});

export const confirmPayment = asyncHandler(async (req: Request, res: Response) => {
  const record = await PaymentRecord.findOneAndUpdate(
    { paymentId: req.params.paymentId },
    { status: 'confirmed' },
    { new: true },
  );
  if (!record) throw AppError.notFound('Payment record not found');
  res.json({ record });
});
