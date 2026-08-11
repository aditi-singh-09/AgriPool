import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    role: {
      type: String,
      required: true,
      enum: ['buyer', 'farmer', 'cooperative', 'transport', 'warehouse', 'admin'],
    },
    walletAddress: {
      type: String,
      trim: true,
      match: [/^G[A-Z2-7]{55}$/, 'walletAddress must be a valid Stellar public key'],
    },
    tokenVersion: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function comparePassword(candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
};

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>> & {
  comparePassword(candidate: string): Promise<boolean>;
};

export const User = model('User', userSchema);
