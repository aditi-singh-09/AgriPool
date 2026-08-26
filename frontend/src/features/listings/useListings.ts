import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { simulateRead } from '../../lib/soroban';
import { submitCreateListing } from './listingService';
import { nativeToScVal } from '@stellar/stellar-sdk';
import type { Listing, ListingUnit } from '../../types';
import { useWalletAuth } from '../auth/useWalletAuth';
import { v4 as uuidv4 } from 'uuid';

interface ListingFilters {
  search?: string;
  produceType?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
}

export function useListings(filters: ListingFilters) {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: async () => {
      // Fetch all listings from chain
      const listingIds: string[] = await simulateRead('get_all_listings');
      
      const listings: Listing[] = [];
      for (const id of listingIds) {
        try {
          const l = await simulateRead('get_listing', nativeToScVal(id, { type: 'symbol' }));
          listings.push({
            _id: l.listing_id,
            sellerId: l.farmer, // we use address as farmer id now
            title: l.title,
            description: l.title,
            produceType: 'grains',
            unit: 'tonne',
            pricePerUnit: Number(l.price) / 10000000,
            quantityAvailable: l.quantity,
            region: 'Global',
            images: [],
            status: l.active ? 'active' : 'sold',
            poolId: l.pool_id,
            createdAt: new Date(Number(l.created_at) * 1000).toISOString(),
            updatedAt: new Date(Number(l.created_at) * 1000).toISOString(),
          } as Listing);
        } catch (e) {
          console.error("Failed to parse listing", id, e);
        }
      }

      return { listings, pagination: { page: 1, pages: 1, total: listings.length } };
    },
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      if (!id) throw new Error('No listing ID');
      const l = await simulateRead('get_listing', nativeToScVal(id, { type: 'symbol' }));
      return {
        _id: l.listing_id,
        sellerId: l.farmer,
        title: l.title,
        description: l.title,
        produceType: 'grains',
        unit: 'tonne',
        pricePerUnit: Number(l.price) / 10000000, // Convert stroops to XLM
        quantityAvailable: l.quantity,
        region: 'Global',
        images: [],
        status: l.active ? 'active' : 'sold',
        poolId: l.pool_id,
        createdAt: new Date(Number(l.created_at) * 1000).toISOString(),
        updatedAt: new Date(Number(l.created_at) * 1000).toISOString(),
      } as Listing;
    },
    enabled: Boolean(id),
  });
}

export interface CreateListingInput {
  title: string;
  description: string;
  produceType: string;
  unit: ListingUnit;
  pricePerUnit: number;
  quantityAvailable: number;
  poolId: string;
  region?: string;
  images?: string[];
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  const auth = useWalletAuth();

  return useMutation({
    mutationFn: async (input: CreateListingInput) => {
      if (!auth.address) throw new Error('Not connected');
      const listingId = 'L' + uuidv4().substring(0, 8).toUpperCase();
      
      const priceStroops = Math.floor(input.pricePerUnit * 10000000).toString();
      
      const txHash = await submitCreateListing({
        listingId,
        poolId: input.poolId,
        farmerAddress: auth.address,
        title: input.title,
        priceStroops,
        quantity: input.quantityAvailable,
      });

      return { _id: listingId, sellerId: auth.address, createdAt: new Date().toISOString(), ...input, status: 'active', txHash } as Listing & { txHash: string };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
