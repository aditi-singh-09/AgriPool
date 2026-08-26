import { useCallback, useEffect, useState } from 'react';
import {
  isConnected as freighterIsConnected,
  requestAccess,
  getAddress,
  getNetworkDetails,
} from '@stellar/freighter-api';
import type { UserRole } from '../../types';

const ROLE_KEY = 'agripool.role';
const NAME_KEY = 'agripool.displayName';

export interface WalletAuthState {
  address: string | null;
  network: string | null;
  role: Exclude<UserRole, 'admin'> | null;
  displayName: string | null;
  isConnected: boolean;
  isFreighterInstalled: boolean;
  isConnecting: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initial: WalletAuthState = {
  address: null,
  network: null,
  role: null,
  displayName: null,
  isConnected: false,
  isFreighterInstalled: false,
  isConnecting: false,
  isInitialized: false,
  error: null,
};

export function useWalletAuth() {
  const [state, setState] = useState<WalletAuthState>(initial);

  // Restore saved role + name on mount, and check if wallet still connected
  useEffect(() => {
    const run = async () => {
      const { isConnected: connected } = await freighterIsConnected();
      if (!connected) {
        setState((s) => ({ ...s, isFreighterInstalled: false, isInitialized: true }));
        return;
      }
      setState((s) => ({ ...s, isFreighterInstalled: true }));

      const addressResult = await getAddress();
      if (addressResult.error || !addressResult.address) {
        setState((s) => ({ ...s, isInitialized: true }));
        return;
      }

      const networkResult = await getNetworkDetails();
      const savedRole = localStorage.getItem(ROLE_KEY) as WalletAuthState['role'];
      const savedName = localStorage.getItem(NAME_KEY);

      setState((s) => ({
        ...s,
        address: addressResult.address,
        network: networkResult.network ?? null,
        role: savedRole,
        displayName: savedName,
        isConnected: Boolean(addressResult.address && savedRole),
        isInitialized: true,
      }));
    };

    void run();

    const handleSync = () => void run();
    window.addEventListener('agripool_wallet_sync', handleSync);
    return () => window.removeEventListener('agripool_wallet_sync', handleSync);
  }, []);

  const connect = useCallback(
    async (role: Exclude<UserRole, 'admin'>, displayName: string) => {
      setState((s) => ({ ...s, isConnecting: true, error: null }));
      try {
        const { isConnected: connected } = await freighterIsConnected();
        if (!connected) {
          setState((s) => ({
            ...s,
            isConnecting: false,
            isFreighterInstalled: false,
            error: 'Freighter is not installed. Install the browser extension.',
          }));
          return;
        }

        const result = await requestAccess();
        if (result.error) {
          setState((s) => ({
            ...s,
            isConnecting: false,
            error: result.error!.message ?? 'Connection was declined',
          }));
          return;
        }

        const networkResult = await getNetworkDetails();
        localStorage.setItem(ROLE_KEY, role);
        localStorage.setItem(NAME_KEY, displayName);

        setState((s) => ({
          ...s,
          address: result.address,
          network: networkResult.network ?? null,
          role,
          displayName,
          isConnected: true,
          isInitialized: true,
          isFreighterInstalled: true,
          isConnecting: false,
        }));
        
        window.dispatchEvent(new Event('agripool_wallet_sync'));
      } catch {
        setState((s) => ({ ...s, isConnecting: false, error: 'Could not connect to Freighter' }));
      }
    },
    [],
  );

  const disconnect = useCallback(() => {
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(NAME_KEY);
    setState({ ...initial, isInitialized: true, isFreighterInstalled: state.isFreighterInstalled });
    window.dispatchEvent(new Event('agripool_wallet_sync'));
  }, [state.isFreighterInstalled]);

  return { ...state, connect, disconnect };
}
