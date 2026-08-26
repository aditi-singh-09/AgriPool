import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

// ---------------------------------------------------------
// LocalStorage Mock API (Replaces Centralized Backend)
// ---------------------------------------------------------
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getLocal<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const api = {
  get: async (url: string, ..._args: any[]): Promise<any> => {
    await delay(300);
    if (url === '/pools') {
      return { data: { pools: getLocal('agripool_pools', []) } };
    }
    if (url.startsWith('/pools/')) {
      const id = url.split('/').pop();
      const pool = getLocal<any[]>('agripool_pools', []).find((p) => p.poolId === id);
      if (pool) return { data: { pool } };
      throw new Error('Not found');
    }
    if (url === '/listings') {
      const all = getLocal<any[]>('agripool_listings', []);
      return { data: { listings: all.filter((l) => l.status === 'active'), total: all.length, pages: 1 } };
    }
    if (url.startsWith('/listings/')) {
      const id = url.split('/').pop();
      const listing = getLocal<any[]>('agripool_listings', []).find((l) => l._id === id);
      if (listing) return { data: { listing } };
      throw new Error('Not found');
    }
    if (url === '/payments/me') {
      return { data: { payments: getLocal('agripool_payments', []) } };
    }
    return { data: {} };
  },
  post: async (url: string, body: any, ..._args: any[]): Promise<any> => {
    await delay(400);
    if (url === '/pools') {
      const pools = getLocal<any[]>('agripool_pools', []);
      const newPool = { _id: uuidv4(), ...body, active: true, createdAt: new Date().toISOString() };
      setLocal('agripool_pools', [...pools, newPool]);
      return { data: { pool: newPool } };
    }
    if (url === '/listings') {
      const listings = getLocal<any[]>('agripool_listings', []);
      const newListing = { _id: uuidv4(), ...body, status: 'active', createdAt: new Date().toISOString(), sellerId: { _id: 'local', displayName: localStorage.getItem('agripool.displayName') || 'User' } };
      setLocal('agripool_listings', [...listings, newListing]);
      return { data: { listing: newListing } };
    }
    if (url === '/payments') {
      const payments = getLocal<any[]>('agripool_payments', []);
      const newPayment = { _id: uuidv4(), ...body, status: 'confirmed', createdAt: new Date().toISOString() };
      setLocal('agripool_payments', [...payments, newPayment]);
      
      // Update listing status
      if (body.listingId) {
        const listings = getLocal<any[]>('agripool_listings', []);
        const idx = listings.findIndex(l => l._id === body.listingId);
        if (idx !== -1) {
          listings[idx].status = 'sold';
          setLocal('agripool_listings', listings);
        }
      }
      return { data: { payment: newPayment } };
    }
    return { data: {} };
  }
};
