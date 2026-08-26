import { Link } from 'react-router-dom';
import { Receipt, PlusCircle, Boxes } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useMyPayments } from '../features/payments/usePayments';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import { Button } from '../components/ui/Button';
import { FeedbackForm } from '../features/payments/FeedbackForm';

function formatStroopsToXlm(amount: string): string {
  return (Number(BigInt(amount)) / 10_000_000).toFixed(2);
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data: payments, isLoading } = useMyPayments();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Welcome, {user.displayName}</h1>
          <p className="mt-1 text-sm capitalize text-graphite-600">{user.role} account</p>
        </div>
        {(user.role === 'farmer' || user.role === 'cooperative') && (
          <Link to="/listings/new">
            <Button>
              <PlusCircle className="h-4 w-4" aria-hidden />
              New listing
            </Button>
          </Link>
        )}
        {user.role === 'cooperative' && (
          <Link to="/pools/new">
            <Button variant="secondary">
              <Boxes className="h-4 w-4" aria-hidden />
              Register settlement pool
            </Button>
          </Link>
        )}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Your settlements</h2>
        <div className="mt-4">
          {isLoading && (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          )}
          {!isLoading && payments?.length === 0 && (
            <EmptyState
              icon={Receipt}
              title="No settlements yet"
              description="Once you pay for a listing, the settlement will appear here with its transaction hash."
              action={
                <Link to="/marketplace">
                  <Button size="sm">Browse the marketplace</Button>
                </Link>
              }
            />
          )}
          <ul className="divide-y divide-graphite-700 overflow-hidden rounded-xl border border-graphite-700">
            {payments?.map((p) => (
              <li key={p._id} className="flex items-center justify-between bg-graphite-800 px-4 py-3">
                <div>
                  <p className="font-mono text-sm">{p.transactionHash.slice(0, 16)}…</p>
                  <p className="text-xs text-graphite-600">{new Date(p.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{formatStroopsToXlm(p.amount)} XLM</p>
                  <p className="text-xs uppercase tracking-wide text-graphite-600">{p.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-graphite-700 bg-graphite-800 p-6">
        <h2 className="font-display text-xl font-semibold">How was your experience?</h2>
        <p className="mt-1 text-sm text-graphite-600">
          Your feedback shapes what we fix next — it's read by the AgriPool team, not shared publicly.
        </p>
        <FeedbackForm />
      </section>
    </div>
  );
}
