import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-5xl font-semibold text-marigold-500">404</p>
      <p className="mt-3 font-display text-xl font-semibold">This page isn't in the ledger</p>
      <p className="mt-1.5 text-sm text-graphite-600">The page you're looking for doesn't exist or moved.</p>
      <Link to="/" className="mt-6">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
