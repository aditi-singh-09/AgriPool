import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWalletAuth } from '../features/auth/useWalletAuth';
import type { UserRole } from '../types';
import { Spinner } from './Spinner';

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { isConnected, isConnecting, isInitialized, role } = useWalletAuth();
  const location = useLocation();

  if (!isInitialized || isConnecting) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isConnected) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && role && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
