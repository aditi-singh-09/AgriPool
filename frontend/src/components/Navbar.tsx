import { NavLink, useNavigate } from 'react-router-dom';
import { Sprout, LayoutDashboard, ShieldCheck, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useFreighterWallet } from '../features/wallet/useFreighterWallet';
import { Button } from './ui/Button';
import { cn } from '../lib/cn';

function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function Navbar() {
  const { user, logout } = useAuth();
  const wallet = useFreighterWallet();
  const navigate = useNavigate();

  const navItem = 'text-sm font-medium text-parchment-300 hover:text-marigold-400 transition-colors';

  return (
    <header className="sticky top-0 z-40 border-b border-graphite-700 bg-graphite-900/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <Sprout className="h-5 w-5 text-marigold-500" aria-hidden />
          AgriPool
        </NavLink>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/marketplace" className={({ isActive }) => cn(navItem, isActive && 'text-marigold-400')}>
            Marketplace
          </NavLink>
          <NavLink to="/explorer" className={({ isActive }) => cn(navItem, isActive && 'text-marigold-400')}>
            Transaction explorer
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={({ isActive }) => cn(navItem, isActive && 'text-marigold-400')}>
              <span className="flex items-center gap-1.5">
                <LayoutDashboard className="h-4 w-4" aria-hidden />
                Dashboard
              </span>
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => cn(navItem, isActive && 'text-marigold-400')}>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Admin
              </span>
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant={wallet.address ? 'secondary' : 'outline'}
            size="sm"
            onClick={wallet.connect}
            isLoading={wallet.isConnecting}
            title={wallet.error ?? undefined}
          >
            <Wallet className="h-4 w-4" aria-hidden />
            {wallet.address ? shortAddress(wallet.address) : 'Connect wallet'}
          </Button>

          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')}>
              Log in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
