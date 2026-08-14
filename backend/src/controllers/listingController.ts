import type { Request, Response } from 'express';
import { FilterQuery } from 'mongoose';
import { Listing } from '../models/Listing.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { track } from '../config/posthog.js';

export const createListing = asyncHandler(async (req: Request, res: Response) => {
  if (!['farmer', 'cooperative'].includes(req.user!.role)) {
    throw AppError.forbidden('Only farmers or cooperative managers can create listings');
  }
  const listing = await Listing.create({ ...req.body, sellerId: req.user!.id });
  track(req.user!.id, 'listing_created', { produceType: listing.produceType, poolId: listing.poolId });
  res.status(201).json({ listing });
});

export const updateListing = asyncHandler(async (req: Request, res: Response) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) throw AppError.notFound('Listing not found');
  if (listing.sellerId.toString() !== req.user!.id && req.user!.role !== 'admin') {
    throw AppError.forbidden('You can only edit your own listings');
  }
  Object.assign(listing, req.body);
  await listing.save();
  res.json({ listing });
});

export const getListing = asyncHandler(async (req: Request, res: Response) => {
  const listing = await Listing.findById(req.params.id).populate('sellerId', 'displayName role');
  if (!listing) throw AppError.notFound('Listing not found');
  res.json({ listing });
});

export const listListings = asyncHandler(async (req: Request, res: Response) => {
  const { search, produceType, region, minPrice, maxPrice, page, limit } = req.query as unknown as {
    search?: string;
    produceType?: string;
    region?: string;
    minPrice?: number;
    maxPrice?: number;
    page: number;
    limit: number;
  };

  const filter: FilterQuery<typeof Listing> = { status: 'active' };
  if (search) filter.$text = { $search: search };
  if (produceType) filter.produceType = produceType;
  if (region) filter.region = region;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.pricePerUnit = {};
    if (minPrice !== undefined) filter.pricePerUnit.$gte = minPrice;
    if (maxPrice !== undefined) filter.pricePerUnit.$lte = maxPrice;
  }

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .populate('sellerId', 'displayName role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Listing.countDocuments(filter),
  ]);

  res.json({ listings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const deleteListing = asyncHandler(async (req: Request, res: Response) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) throw AppError.notFound('Listing not found');
  if (listing.sellerId.toString() !== req.user!.id && req.user!.role !== 'admin') {
    throw AppError.forbidden('You can only delete your own listings');
  }
  listing.status = 'archived';
  await listing.save();
  res.status(204).send();
});
