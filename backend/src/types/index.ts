export type UserRole = 'buyer' | 'farmer' | 'cooperative' | 'transport' | 'warehouse' | 'admin';

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  tokenVersion: number;
}

export interface AuthenticatedRequestUser {
  id: string;
  role: UserRole;
}

// Mirrors the on-chain `Participant` shape from the Soroban contract, used
// when composing pool-creation payloads for the frontend to sign & submit.
export interface ParticipantShare {
  role: Exclude<UserRole, 'buyer' | 'admin'>;
  walletAddress: string;
  shareBps: number;
}

export type ListingStatus = 'draft' | 'active' | 'sold' | 'archived';
