import {
  Contract,
  TransactionBuilder,
  nativeToScVal,
  BASE_FEE,
  Networks,
  rpc,
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import type { Participant } from '../../types';

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID as string | undefined;
const SOROBAN_RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = import.meta.env.VITE_STELLAR_NETWORK === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET;

export interface CreatePoolArgs {
  poolId: string;
  cooperativeName: string;
  participants: Participant[];
  callerAddress: string;
}

export async function submitCreatePool(args: CreatePoolArgs): Promise<string> {
  if (!CONTRACT_ID) throw new Error('VITE_CONTRACT_ID is not configured.');

  const server = new rpc.Server(SOROBAN_RPC_URL);
  const sourceAccount = await server.getAccount(args.callerAddress);
  const contract = new Contract(CONTRACT_ID);

  // In stellar-sdk, passing an array of objects for a Soroban Vec<Participant>
  // requires explicitly formatting the keys if they aren't standard or if it fails
  // inference, but the SDK has gotten good at inferring structs if keys match.
  // Our Rust struct `Participant` has fields: `role` (Symbol), `wallet` (Address), `share_bps` (u32).
  const participantsList = args.participants.map(p => ({
    role: nativeToScVal(p.role, { type: 'symbol' }),
    wallet: nativeToScVal(p.walletAddress, { type: 'address' }),
    share_bps: nativeToScVal(p.shareBps, { type: 'u32' })
  }));

  const operation = contract.call(
    'create_pool',
    nativeToScVal(args.poolId, { type: 'symbol' }),
    nativeToScVal(participantsList), 
    nativeToScVal(args.callerAddress, { type: 'address' }),
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
    address: args.callerAddress,
  });

  if (signError) throw new Error(signError.message ?? 'Transaction declined');

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === 'ERROR') throw new Error('Transaction rejected by network');
  
  return sendResult.hash;
}
