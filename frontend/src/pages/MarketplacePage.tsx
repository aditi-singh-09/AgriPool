import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, PackageSearch } from 'lucide-react';
import { useListings } from '../features/listings/useListings';
import { CardSkeleton } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';

export function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [produceType, setProduceType] = useState('');
  const { data, isLoading, isError } = useListings({ search: search || undefined, produceType: produceType || undefined });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Marketplace</h1>
          <p className="mt-1 text-sm text-graphite-600">Every listing is tied to a cooperative's settlement pool.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-600" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search produce…"
              className="h-11 w-56 rounded-lg border border-graphite-600 bg-graphite-800 pl-9 pr-3 text-sm text-parchment-50 outline-none focus:border-marigold-500"
              aria-label="Search listings"
            />
          </div>
          <input
            value={produceType}
            onChange={(e) => setProduceType(e.target.value)}
            placeholder="Filter by type…"
            className="h-11 w-40 rounded-lg border border-graphite-600 bg-graphite-800 px-3 text-sm text-parchment-50 outline-none focus:border-marigold-500"
            aria-label="Filter by produce type"
          />
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}

        {!isLoading && isError && (
          <div className="col-span-full">
            <EmptyState
              icon={PackageSearch}
              title="Couldn't load listings"
              description="The marketplace API might not be running yet. Start the backend and refresh."
            />
          </div>
        )}

        {!isLoading && !isError && data?.listings.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={PackageSearch}
              title="No listings match yet"
              description="Try a different search, or check back once a farmer or cooperative lists produce."
            />
          </div>
        )}

        {data?.listings.map((listing) => (
          <Link
            key={listing._id}
            to={`/marketplace/${listing._id}`}
            className="group rounded-xl border border-graphite-700 bg-graphite-800 p-4 transition-colors hover:border-marigold-500/60"
          >
            <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-graphite-700">
              {listing.images[0] ? (
                <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-graphite-600">
                  <PackageSearch className="h-8 w-8" aria-hidden />
                </div>
              )}
            </div>
            <p className="font-display text-lg font-semibold group-hover:text-marigold-400">{listing.title}</p>
            <p className="mt-1 text-sm text-graphite-600">{listing.produceType}</p>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-mono text-sm font-semibold">
                {listing.pricePerUnit.toFixed(2)} XLM / {listing.unit}
              </span>
              <span className="text-xs text-graphite-600">{listing.quantityAvailable} available</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
