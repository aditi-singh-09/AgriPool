import { Contract, TransactionBuilder, BASE_FEE, Networks, rpc, xdr, scValToNative } from '@stellar/stellar-sdk';

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID as string | undefined;
const SOROBAN_RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = import.meta.env.VITE_STELLAR_NETWORK === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET;
const READ_SOURCE = import.meta.env.VITE_SOROBAN_READ_SOURCE_ACCOUNT as string | undefined;

export async function simulateRead(method: string, ...args: xdr.ScVal[]): Promise<any> {
  if (!CONTRACT_ID) throw new Error('VITE_CONTRACT_ID is not configured');
  if (!READ_SOURCE) throw new Error('VITE_SOROBAN_READ_SOURCE_ACCOUNT is not configured');

  const server = new rpc.Server(SOROBAN_RPC_URL);
  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount(READ_SOURCE);

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  const retval = (sim as rpc.Api.SimulateTransactionSuccessResponse).result?.retval;
  if (!retval) return null;
  return scValToNative(retval);
}
