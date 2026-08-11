import { Schema, model } from 'mongoose';

const paymentRecordSchema = new Schema(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    poolId: { type: String, required: true, index: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing' },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    buyerWallet: { type: String, required: true },
    tokenAddress: { type: String, required: true },
    amount: { type: String, required: true }, // stored as string: i128 exceeds JS safe integer range
    transactionHash: { type: String, required: true, unique: true },
    ledgerTimestamp: { type: Number, required: true },
    // 'submitted' until the indexer confirms the settle() call landed on-chain.
    status: { type: String, enum: ['submitted', 'confirmed', 'failed'], default: 'submitted', index: true },
  },
  { timestamps: true },
);

export const PaymentRecord = model('PaymentRecord', paymentRecordSchema);
