import {
  Contract,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  BASE_FEE,
  Networks,
  rpc,
  Asset,
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID as string | undefined;
const SOROBAN_RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = import.meta.env.VITE_STELLAR_NETWORK === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET;

/** The Soroban contract ID for native XLM on the configured network — this
 * is what buyers pay with unless a listing specifies a different asset. */
export function nativeAssetContractId(): string {
  return Asset.native().contractId(NETWORK_PASSPHRASE);
}

export interface SettlePaymentArgs {
  paymentId: string;
  poolId: string;
  buyerAddress: string;
  tokenAddress: string;
  amountStroops: string;
}

export interface SettlePaymentResult {
  transactionHash: string;
  ledgerTimestamp: number;
}

/**
 * Builds the `settle` contract invocation, asks Freighter to sign it as the
 * buyer, submits it to the network, and polls for confirmation. Funds move
 * directly from the buyer's wallet to every participant inside the
 * contract call itself — this function never touches or custodies funds,
 * it only assembles and relays a transaction the buyer has authorized.
 */
export async function submitSettlement(args: SettlePaymentArgs): Promise<SettlePaymentResult> {
  if (!CONTRACT_ID) {
    throw new Error(
      'VITE_CONTRACT_ID is not configured. Deploy the contract to testnet and set the env var first.',
    );
  }

  const server = new rpc.Server(SOROBAN_RPC_URL);
  const sourceAccount = await server.getAccount(args.buyerAddress);
  const contract = new Contract(CONTRACT_ID);

  const operation = contract.call(
    'settle',
    nativeToScVal(args.paymentId, { type: 'symbol' }),
    nativeToScVal(args.poolId, { type: 'symbol' }),
    nativeToScVal(args.buyerAddress, { type: 'address' }),
    nativeToScVal(args.tokenAddress, { type: 'address' }),
    nativeToScVal(BigInt(args.amountStroops), { type: 'i128' }),
  );

  const builtTx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(builtTx);

  const { signedTxXdr, error: signError } = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: args.buyerAddress,
  });
  if (signError) {
    throw new Error(signError.message ?? 'Freighter declined to sign the transaction');
  }

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === 'ERROR') {
    throw new Error('The network rejected the settlement transaction');
  }

  const confirmed = await pollForConfirmation(server, sendResult.hash);
  return { transactionHash: sendResult.hash, ledgerTimestamp: confirmed };
}

async function pollForConfirmation(server: rpc.Server, hash: string): Promise<number> {
  const maxAttempts = 15;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await server.getTransaction(hash);
    if (result.status === 'SUCCESS') {
      return Math.floor(Date.now() / 1000);
    }
    if (result.status === 'FAILED') {
      throw new Error('Settlement transaction failed on-chain — no funds were moved twice, this payment_id is safe to retry with a new id');
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Timed out waiting for confirmation — check the transaction hash on Stellar Expert before retrying');
}

/** Reads the live pool + history via simulation (no signature required). */
export async function readPoolFromChain(poolId: string): Promise<unknown> {
  if (!CONTRACT_ID) throw new Error('VITE_CONTRACT_ID is not configured');
  const server = new rpc.Server(SOROBAN_RPC_URL);
  const contract = new Contract(CONTRACT_ID);
  // A throwaway simulation-only keypair account funded on testnet works fine
  // here since simulated calls never touch the ledger or cost a fee.
  const readSource = import.meta.env.VITE_SOROBAN_READ_SOURCE_ACCOUNT as string | undefined;
  if (!readSource) throw new Error('VITE_SOROBAN_READ_SOURCE_ACCOUNT is not configured');

  const account = await server.getAccount(readSource);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('get_pool', nativeToScVal(poolId, { type: 'symbol' })))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  const retval = (sim as rpc.Api.SimulateTransactionSuccessResponse).result?.retval;
  return retval ? scValToNative(retval) : null;
}
