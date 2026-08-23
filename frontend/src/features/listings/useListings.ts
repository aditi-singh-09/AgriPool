import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Listing, ListingUnit } from '../../types';

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
      const res = await api.get('/listings', { params: filters });
      return res.data as { listings: Listing[]; pagination: { page: number; pages: number; total: number } };
    },
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res = await api.get(`/listings/${id}`);
      return res.data.listing as Listing;
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
  return useMutation({
    mutationFn: async (input: CreateListingInput) => {
      const res = await api.post('/listings', input);
      return res.data.listing as Listing;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
