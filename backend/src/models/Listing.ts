import { Schema, model } from 'mongoose';

const listingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    produceType: { type: String, required: true, trim: true, index: true },
    unit: { type: String, required: true, enum: ['kg', 'quintal', 'tonne', 'crate', 'bag'] },
    pricePerUnit: { type: Number, required: true, min: 0 },
    quantityAvailable: { type: Number, required: true, min: 0 },
    images: { type: [String], default: [] },
    poolId: { type: String, required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'sold', 'archived'],
      default: 'active',
      index: true,
    },
    region: { type: String, trim: true, index: true },
  },
  { timestamps: true },
);

listingSchema.index({ title: 'text', description: 'text', produceType: 'text' });

export const Listing = model('Listing', listingSchema);
