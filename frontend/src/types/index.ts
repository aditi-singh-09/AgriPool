export type UserRole = 'buyer' | 'farmer' | 'cooperative' | 'transport' | 'warehouse' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  walletAddress?: string;
}

export interface Participant {
  role: Exclude<UserRole, 'buyer' | 'admin'>;
  walletAddress: string;
  shareBps: number;
  displayName: string;
}

export interface DistributionPool {
  _id: string;
  poolId: string;
  cooperativeName: string;
  participants: Participant[];
  active: boolean;
  lastKnownPaymentCount: number;
  createdAt: string;
}

export type ListingStatus = 'draft' | 'active' | 'sold' | 'archived';
export type ListingUnit = 'kg' | 'quintal' | 'tonne' | 'crate' | 'bag';

export interface Listing {
  _id: string;
  title: string;
  description: string;
  produceType: string;
  unit: ListingUnit;
  pricePerUnit: number;
  quantityAvailable: number;
  images: string[];
  poolId: string;
  sellerId: { _id: string; displayName: string; role: UserRole } | string;
  status: ListingStatus;
  region?: string;
  createdAt: string;
}

export interface PaymentRecord {
  _id: string;
  paymentId: string;
  poolId: string;
  buyerWallet: string;
  tokenAddress: string;
  amount: string;
  transactionHash: string;
  ledgerTimestamp: number;
  status: 'submitted' | 'confirmed' | 'failed';
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiErrorShape {
  error: { code: string; message: string; details?: unknown };
}
