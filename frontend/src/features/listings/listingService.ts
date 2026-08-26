import {
  Contract,
  TransactionBuilder,
  nativeToScVal,
  BASE_FEE,
  Networks,
  rpc,
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID as string | undefined;
const SOROBAN_RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = import.meta.env.VITE_STELLAR_NETWORK === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET;

export interface CreateListingArgs {
  listingId: string;
  poolId: string;
  farmerAddress: string;
  title: string;
  priceStroops: string;
  quantity: number;
}

export async function submitCreateListing(args: CreateListingArgs): Promise<string> {
  if (!CONTRACT_ID) throw new Error('VITE_CONTRACT_ID is not configured.');

  const server = new rpc.Server(SOROBAN_RPC_URL);
  const sourceAccount = await server.getAccount(args.farmerAddress);
  const contract = new Contract(CONTRACT_ID);

  const operation = contract.call(
    'create_listing',
    nativeToScVal(args.listingId, { type: 'symbol' }),
    nativeToScVal(args.poolId, { type: 'symbol' }),
    nativeToScVal(args.farmerAddress, { type: 'address' }),
    nativeToScVal(args.title, { type: 'string' }),
    nativeToScVal(BigInt(args.priceStroops), { type: 'i128' }),
    nativeToScVal(args.quantity, { type: 'u32' }),
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
    address: args.farmerAddress,
  });

  if (signError) throw new Error(signError.message ?? 'Transaction declined');

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === 'ERROR') throw new Error('Transaction rejected by network');
  
  return sendResult.hash;
}
