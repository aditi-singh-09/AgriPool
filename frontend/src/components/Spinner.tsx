import { cn } from '../lib/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('h-6 w-6 animate-spin rounded-full border-2 border-graphite-600 border-t-marigold-500', className)}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border border-graphite-700 bg-graphite-800 p-4">
      <div className="h-32 rounded-lg bg-graphite-700" />
      <div className="h-4 w-3/4 rounded bg-graphite-700" />
      <div className="h-3 w-1/2 rounded bg-graphite-700" />
    </div>
  );
}
