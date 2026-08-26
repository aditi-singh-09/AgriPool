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
  error: null,
};

export function useWalletAuth() {
  const [state, setState] = useState<WalletAuthState>(initial);

  // Restore saved role + name on mount, and check if wallet still connected
  useEffect(() => {
    const run = async () => {
      const { isConnected } = await freighterIsConnected();
      if (!isConnected) {
        setState((s) => ({ ...s, isFreighterInstalled: false }));
        return;
      }
      setState((s) => ({ ...s, isFreighterInstalled: true }));

      const addressResult = await getAddress();
      if (addressResult.error || !addressResult.address) return;

      const networkResult = await getNetworkDetails();
      const savedRole = localStorage.getItem(ROLE_KEY) as WalletAuthState['role'];
      const savedName = localStorage.getItem(NAME_KEY);

      setState((s) => ({
        ...s,
        address: addressResult.address,
        network: networkResult.network ?? null,
        role: savedRole,
        displayName: savedName,
        isConnected: true,
      }));
    };
    void run();
  }, []);

  const connect = useCallback(
    async (role: Exclude<UserRole, 'admin'>, displayName: string) => {
      setState((s) => ({ ...s, isConnecting: true, error: null }));
      try {
        const { isConnected } = await freighterIsConnected();
        if (!isConnected) {
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
          isFreighterInstalled: true,
          isConnecting: false,
        }));
      } catch {
        setState((s) => ({ ...s, isConnecting: false, error: 'Could not connect to Freighter' }));
      }
    },
    [],
  );

  const disconnect = useCallback(() => {
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(NAME_KEY);
    setState(initial);
  }, []);

  return { ...state, connect, disconnect };
}
