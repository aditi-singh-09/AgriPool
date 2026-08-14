import type { Request, Response } from 'express';
import { Feedback } from '../models/Feedback.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { track } from '../config/posthog.js';

export const submitFeedback = asyncHandler(async (req: Request, res: Response) => {
  const feedback = await Feedback.create({ ...req.body, userId: req.user!.id });
  track(req.user!.id, 'feedback_submitted', { rating: feedback.rating, category: feedback.category });
  res.status(201).json({ feedback });
});

export const listFeedback = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'admin') {
    throw AppError.forbidden('Only admins can view aggregate feedback');
  }
  const feedback = await Feedback.find().populate('userId', 'displayName role').sort({ createdAt: -1 });
  const average =
    feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : null;
  res.json({ feedback, average });
});
