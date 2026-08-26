import { useQuery } from '@tanstack/react-query';
import { Users, Store, Boxes, Receipt, Star } from 'lucide-react';
import { api } from '../lib/api';
import { Spinner } from '../components/Spinner';

interface PlatformStats {
  userCount: number;
  usersByRole: Record<string, number>;
  activeListings: number;
  poolCount: number;
  settledPayments: number;
  averageRating: number | null;
  feedbackCount: number;
}

export function AdminPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data as PlatformStats;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const cards = [
    { icon: Users, label: 'Registered users', value: data.userCount },
    { icon: Store, label: 'Active listings', value: data.activeListings },
    { icon: Boxes, label: 'Settlement pools', value: data.poolCount },
    { icon: Receipt, label: 'Confirmed settlements', value: data.settledPayments },
    { icon: Star, label: 'Average rating', value: data.averageRating?.toFixed(1) ?? '—' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Platform overview</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-graphite-700 bg-graphite-800 p-5">
            <Icon className="h-5 w-5 text-marigold-500" aria-hidden />
            <p className="mt-3 font-mono text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-graphite-600">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-graphite-700 bg-graphite-800 p-5">
        <p className="text-sm font-medium text-parchment-200">Users by role</p>
        <ul className="mt-3 space-y-1.5 text-sm text-graphite-600">
          {Object.entries(data.usersByRole).map(([role, count]) => (
            <li key={role} className="flex justify-between capitalize">
              <span>{role}</span>
              <span className="font-mono text-parchment-100">{count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
