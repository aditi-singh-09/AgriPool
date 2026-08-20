import { useCallback, useEffect, useState } from 'react';
import {
  isConnected as freighterIsConnected,
  requestAccess,
  getAddress,
  getNetworkDetails,
} from '@stellar/freighter-api';

interface WalletState {
  address: string | null;
  network: string | null;
  isFreighterInstalled: boolean;
  isConnecting: boolean;
  error: string | null;
}

const initialState: WalletState = {
  address: null,
  network: null,
  isFreighterInstalled: false,
  isConnecting: false,
  error: null,
};

export function useFreighterWallet() {
  const [state, setState] = useState<WalletState>(initialState);

  const refreshAddress = useCallback(async () => {
    const { isConnected } = await freighterIsConnected();
    setState((s) => ({ ...s, isFreighterInstalled: isConnected }));
    if (!isConnected) return;

    const addressResult = await getAddress();
    if (addressResult.error) {
      setState((s) => ({ ...s, address: null }));
      return;
    }
    const networkResult = await getNetworkDetails();
    setState((s) => ({
      ...s,
      address: addressResult.address || null,
      network: networkResult.network ?? null,
    }));
  }, []);

  useEffect(() => {
    void refreshAddress();
  }, [refreshAddress]);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const { isConnected } = await freighterIsConnected();
      if (!isConnected) {
        setState((s) => ({
          ...s,
          isConnecting: false,
          isFreighterInstalled: false,
          error: 'Freighter is not installed. Install the browser extension to connect your wallet.',
        }));
        return;
      }
      const result = await requestAccess();
      if (result.error) {
        setState((s) => ({ ...s, isConnecting: false, error: result.error!.message ?? 'Connection was declined' }));
        return;
      }
      const networkResult = await getNetworkDetails();
      setState((s) => ({
        ...s,
        address: result.address,
        network: networkResult.network ?? null,
        isFreighterInstalled: true,
        isConnecting: false,
      }));
    } catch {
      setState((s) => ({ ...s, isConnecting: false, error: 'Could not connect to Freighter' }));
    }
  }, []);

  const disconnect = useCallback(() => {
    // Freighter has no programmatic "disconnect" — this just clears local UI state.
    setState((s) => ({ ...s, address: null }));
  }, []);

  return { ...state, connect, disconnect, refreshAddress };
}
