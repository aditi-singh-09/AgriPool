import { Schema, model } from 'mongoose';

const participantSchema = new Schema(
  {
    role: {
      type: String,
      required: true,
      enum: ['farmer', 'cooperative', 'transport', 'warehouse'],
    },
    walletAddress: { type: String, required: true },
    shareBps: { type: Number, required: true, min: 1, max: 10_000 },
    displayName: { type: String, required: true },
  },
  { _id: false },
);

const distributionPoolSchema = new Schema(
  {
    poolId: { type: String, required: true, unique: true, index: true },
    cooperativeName: { type: String, required: true, trim: true },
    participants: {
      type: [participantSchema],
      required: true,
      validate: {
        validator: (list: { shareBps: number }[]) =>
          list.length > 0 && list.reduce((sum, p) => sum + p.shareBps, 0) === 10_000,
        message: 'Participant shares must sum to exactly 10,000 basis points (100%)',
      },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    active: { type: Boolean, default: true },
    // Cached from chain after each settlement poll; source of truth remains the contract.
    lastKnownPaymentCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const DistributionPool = model('DistributionPool', distributionPoolSchema);
