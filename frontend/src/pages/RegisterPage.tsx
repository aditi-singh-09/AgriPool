import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Wallet, Sprout } from 'lucide-react';
import { useWalletAuth } from '../features/auth/useWalletAuth';
import { Button } from '../components/ui/Button';
import type { UserRole } from '../types';

const ROLES: { value: Exclude<UserRole, 'admin'>; label: string; description: string }[] = [
  { value: 'buyer', label: 'Buyer', description: 'Browse and purchase produce from the marketplace' },
  { value: 'farmer', label: 'Farmer', description: 'List produce and receive on-chain payments' },
  { value: 'cooperative', label: 'Cooperative', description: 'Manage pools and distribute payments to members' },
  { value: 'transport', label: 'Transport Provider', description: 'Participate in pool settlements as a transporter' },
  { value: 'warehouse', label: 'Warehouse Operator', description: 'Participate in pool settlements as a warehouse' },
];

export function RegisterPage() {
  const { connect, isConnecting, error } = useWalletAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

  const [selectedRole, setSelectedRole] = useState<Exclude<UserRole, 'admin'>>('buyer');
  const [displayName, setDisplayName] = useState('');
  const [nameError, setNameError] = useState('');

  const handleConnect = async () => {
    if (!displayName.trim() || displayName.trim().length < 2) {
      setNameError('Please enter your name (at least 2 characters)');
      return;
    }
    setNameError('');
    await connect(selectedRole, displayName.trim());
    if (!error) {
      toast.success('Wallet connected — welcome to AgriPool!');
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col justify-center px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-marigold-500/20">
          <Sprout className="h-5 w-5 text-marigold-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold">Join AgriPool</h1>
          <p className="text-sm text-graphite-600">Your Freighter wallet is your account — no password needed.</p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-parchment-300 mb-1.5">Your name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            className="w-full rounded-lg border border-graphite-700 bg-graphite-800 px-3 py-2 text-sm text-parchment-100 placeholder:text-graphite-600 focus:border-marigold-500 focus:outline-none"
          />
          {nameError && <p className="mt-1 text-xs text-stamp-500">{nameError}</p>}
        </div>

        {/* Role picker */}
        <div>
          <label className="block text-sm font-medium text-parchment-300 mb-2">I am a…</label>
          <div className="flex flex-col gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRole(r.value)}
                className={`flex flex-col rounded-lg border px-4 py-3 text-left transition-colors ${
                  selectedRole === r.value
                    ? 'border-marigold-500 bg-marigold-500/10 text-parchment-100'
                    : 'border-graphite-700 bg-graphite-800 text-parchment-300 hover:border-graphite-600'
                }`}
              >
                <span className="text-sm font-medium">{r.label}</span>
                <span className="text-xs text-graphite-600 mt-0.5">{r.description}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-stamp-500/40 bg-stamp-500/10 px-3 py-2 text-sm text-stamp-400">
            {error}
          </p>
        )}

        <Button onClick={handleConnect} isLoading={isConnecting} className="mt-2 w-full">
          <Wallet className="h-4 w-4" />
          Connect Freighter &amp; Join
        </Button>

        <p className="text-center text-xs text-graphite-600">
          Already connected?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-marigold-400 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
