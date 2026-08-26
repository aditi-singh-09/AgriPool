import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Radio } from 'lucide-react';
import { api } from '../lib/api';
import { usePool } from '../features/pools/usePools';
import { usePoolPayments } from '../features/payments/usePayments';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import type { PaymentRecord } from '../types';

function formatStroopsToXlm(amount: string): string {
  return (Number(BigInt(amount)) / 10_000_000).toFixed(2);
}

export function ExplorerPage() {
  const { hash } = useParams<{ hash?: string }>();
  const [poolId, setPoolId] = useState('');
  const [searchedPoolId, setSearchedPoolId] = useState('');

  const { data: pool } = usePool(searchedPoolId || undefined);
  const { data: payments, isLoading } = usePoolPayments(searchedPoolId || undefined);

  const txLookup = useQuery({
    queryKey: ['payment-by-hash', hash],
    queryFn: async () => {
      const res = await api.get(`/payments/tx/${hash}`);
      return res.data.record as PaymentRecord;
    },
    enabled: Boolean(hash),
  });

  if (hash) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-2xl font-semibold">Settlement receipt</h1>
        {txLookup.isLoading && (
          <div className="mt-8 flex justify-center">
            <Spinner />
          </div>
        )}
        {txLookup.data && (
          <div className="mt-6 rounded-xl border border-graphite-700 bg-graphite-800 p-6 font-mono text-sm">
            <Row label="Transaction hash" value={txLookup.data.transactionHash} />
            <Row label="Pool" value={txLookup.data.poolId} />
            <Row label="Amount" value={`${formatStroopsToXlm(txLookup.data.amount)} XLM`} />
            <Row label="Status" value={txLookup.data.status} />
            <Row label="Settled" value={new Date(txLookup.data.createdAt).toLocaleString()} />
          </div>
        )}
        {txLookup.isError && (
          <EmptyState icon={Search} title="Not found" description="No settlement matches this transaction hash." />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Transaction explorer</h1>
      <p className="mt-1 text-sm text-graphite-600">
        Look up any cooperative's settlement history by its pool ID — no login required.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearchedPoolId(poolId.trim());
        }}
        className="mt-6 flex gap-3"
      >
        <input
          value={poolId}
          onChange={(e) => setPoolId(e.target.value)}
          placeholder="e.g. pool_valley_coop"
          className="h-11 flex-1 rounded-lg border border-graphite-600 bg-graphite-800 px-3.5 text-sm outline-none focus:border-marigold-500"
        />
        <button className="rounded-lg bg-marigold-500 px-5 text-sm font-semibold text-graphite-950 hover:bg-marigold-400">
          Search
        </button>
      </form>

      {searchedPoolId && (
        <div className="mt-8">
          {pool && (
            <p className="mb-4 text-sm text-graphite-600">
              <span className="font-display font-semibold text-parchment-100">{pool.cooperativeName}</span> ·{' '}
              {pool.participants.length} participants
            </p>
          )}
          {isLoading && (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          )}
          {!isLoading && payments?.length === 0 && (
            <EmptyState icon={Radio} title="No settlements yet" description="This pool hasn't received a payment yet." />
          )}
          <ul className="divide-y divide-graphite-700 overflow-hidden rounded-xl border border-graphite-700">
            {payments?.map((p) => (
              <li key={p._id} className="flex items-center justify-between bg-graphite-800 px-4 py-3">
                <span className="font-mono text-sm">{p.transactionHash.slice(0, 20)}…</span>
                <span className="font-mono text-sm font-semibold">{formatStroopsToXlm(p.amount)} XLM</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-graphite-700 py-2 last:border-0">
      <span className="text-graphite-600">{label}</span>
      <span className="text-parchment-100">{value}</span>
    </div>
  );
}
