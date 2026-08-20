/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_CONTRACT_ID?: string;
  readonly VITE_SOROBAN_RPC_URL?: string;
  readonly VITE_STELLAR_NETWORK?: 'TESTNET' | 'PUBLIC';
  readonly VITE_SOROBAN_READ_SOURCE_ACCOUNT?: string;
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
