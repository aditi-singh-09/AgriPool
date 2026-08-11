import { Schema, model } from 'mongoose';

const feedbackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentId: { type: String, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
    category: {
      type: String,
      enum: ['payment_experience', 'marketplace', 'wallet_connection', 'general'],
      default: 'general',
    },
  },
  { timestamps: true },
);

export const Feedback = model('Feedback', feedbackSchema);
