import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Wallet, Sprout, ArrowRight } from 'lucide-react';
import { useWalletAuth } from '../features/auth/useWalletAuth';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export function LoginPage() {
  const { connect, isConnecting, error, isConnected } = useWalletAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

  const handleConnect = async () => {
    // If already connected, just navigate
    if (isConnected) {
      navigate(from, { replace: true });
      return;
    }
    await connect('buyer', 'AgriPool User');
    toast.success('Wallet connected');
    navigate(from, { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border border-graphite-700 bg-graphite-800/60 p-8 backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-marigold-500/20">
            <Sprout className="h-5 w-5 text-marigold-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
            <p className="text-sm text-graphite-600">Connect your Freighter wallet to continue.</p>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-graphite-700 bg-graphite-900/40 p-4">
          <p className="text-sm text-parchment-300">
            AgriPool uses your <span className="text-marigold-400 font-medium">Stellar wallet</span> as your
            identity — no email or password required. Your wallet address is your account.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-stamp-500/40 bg-stamp-500/10 px-3 py-2 text-sm text-stamp-400">
            {error}
          </p>
        )}

        <Button onClick={handleConnect} isLoading={isConnecting} className="w-full">
          <Wallet className="h-4 w-4" />
          Connect Freighter wallet
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>

        <p className="mt-6 text-center text-sm text-graphite-600">
          New to AgriPool?{' '}
          <Link to="/register" className="font-medium text-marigold-400 hover:underline">
            Create your profile
          </Link>
        </p>

        <p className="mt-2 text-center text-xs text-graphite-600">
          Don't have Freighter?{' '}
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-marigold-400 hover:underline"
          >
            Install the extension →
          </a>
        </p>
      </div>
    </div>
  );
}
