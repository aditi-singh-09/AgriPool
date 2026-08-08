import { rpc, scValToNative, Address, nativeToScVal, Contract, TransactionBuilder } from '@stellar/stellar-sdk';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Thin read-only wrapper around the Soroban RPC simulate-transaction call.
 * Used to surface authoritative on-chain state (pool config, settlement
 * history) in the dashboard/explorer without requiring a wallet signature —
 * simulated calls don't mutate ledger state and cost no fee.
 *
 * Writes (create_pool, settle, etc.) are never issued from the backend:
 * they must be signed client-side by the acting wallet via Freighter, so
 * custody of funds and authorization never passes through this server.
 */
export class SorobanReader {
  private readonly server: rpc.Server;
  private readonly contract: Contract | null;

  constructor() {
    this.server = new rpc.Server(env.SOROBAN_RPC_URL, { allowHttp: env.NODE_ENV !== 'production' });
    this.contract = env.CONTRACT_ID ? new Contract(env.CONTRACT_ID) : null;
  }

  private assertConfigured(): Contract {
    if (!this.contract) {
      throw new Error('CONTRACT_ID is not configured — set it once the contract is deployed to testnet');
    }
    return this.contract;
  }

  async getPool(poolId: string): Promise<unknown> {
    const contract = this.assertConfigured();
    const account = await this.server.getAccount(await this.getSourceAccount());
    const tx = this.buildSimTx(account, contract.call('get_pool', nativeToScVal(poolId, { type: 'symbol' })));
    const sim = await this.server.simulateTransaction(tx);
    return this.extractResult(sim);
  }

  async getHistory(poolId: string): Promise<unknown> {
    const contract = this.assertConfigured();
    const account = await this.server.getAccount(await this.getSourceAccount());
    const tx = this.buildSimTx(
      account,
      contract.call('get_history', nativeToScVal(poolId, { type: 'symbol' })),
    );
    const sim = await this.server.simulateTransaction(tx);
    return this.extractResult(sim);
  }

  private extractResult(sim: rpc.Api.SimulateTransactionResponse): unknown {
    if (rpc.Api.isSimulationError(sim)) {
      logger.warn({ error: sim.error }, 'Soroban simulation failed');
      throw new Error(`Soroban simulation failed: ${sim.error}`);
    }
    const retval = (sim as rpc.Api.SimulateTransactionSuccessResponse).result?.retval;
    return retval ? scValToNative(retval) : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildSimTx(account: any, operation: any) {
    // A dedicated read-only source account funded once on testnet is used
    // purely to satisfy transaction envelope requirements for simulation.
    return new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.networkPassphrase(),
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();
  }

  private networkPassphrase(): string {
    return env.STELLAR_NETWORK === 'PUBLIC'
      ? 'Public Global Stellar Network ; September 2015'
      : 'Test SDF Network ; September 2015';
  }

  private async getSourceAccount(): Promise<string> {
    if (!process.env.SOROBAN_READ_SOURCE_ACCOUNT) {
      throw new Error('SOROBAN_READ_SOURCE_ACCOUNT env var is required for read simulations');
    }
    return process.env.SOROBAN_READ_SOURCE_ACCOUNT;
  }
}

export const sorobanReader = new SorobanReader();
export { Address };
