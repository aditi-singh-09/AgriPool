import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Listing } from '../models/Listing.js';
import { DistributionPool } from '../models/DistributionPool.js';
import { PaymentRecord } from '../models/PaymentRecord.js';
import { Feedback } from '../models/Feedback.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPlatformStats = asyncHandler(async (_req: Request, res: Response) => {
  const [userCount, activeListings, poolCount, settledPayments, feedbackDocs] = await Promise.all([
    User.countDocuments(),
    Listing.countDocuments({ status: 'active' }),
    DistributionPool.countDocuments({ active: true }),
    PaymentRecord.countDocuments({ status: 'confirmed' }),
    Feedback.find(),
  ]);

  const usersByRole = await User.aggregate<{ _id: string; count: number }>([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  const averageRating =
    feedbackDocs.length > 0
      ? feedbackDocs.reduce((sum, f) => sum + f.rating, 0) / feedbackDocs.length
      : null;

  res.json({
    userCount,
    usersByRole: Object.fromEntries(usersByRole.map((r) => [r._id, r.count])),
    activeListings,
    poolCount,
    settledPayments,
    averageRating,
    feedbackCount: feedbackDocs.length,
  });
});
