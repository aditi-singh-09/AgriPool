import type { Request, Response } from 'express';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadListingImage = asyncHandler(async (req: Request, res: Response) => {
  if (!isCloudinaryConfigured) {
    throw AppError.internal('Image upload is not configured on this environment');
  }
  if (!req.file) {
    throw AppError.badRequest('No image file was provided');
  }
  if (!req.file.mimetype.startsWith('image/')) {
    throw AppError.badRequest('Only image files are accepted');
  }

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'agripool/listings', resource_type: 'image', transformation: [{ width: 1600, crop: 'limit' }] },
      (err, uploaded) => {
        if (err || !uploaded) reject(err ?? new Error('Upload failed'));
        else resolve(uploaded);
      },
    );
    stream.end(req.file!.buffer);
  });

  res.status(201).json({ url: result.secure_url });
});
