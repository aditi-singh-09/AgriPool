import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PackageSearch, MapPin } from 'lucide-react';
import { useListing } from '../features/listings/useListings';
import { usePool } from '../features/pools/usePools';
import { useWalletAuth } from '../features/auth/useWalletAuth';
import { useRecordPayment } from '../features/payments/usePayments';
import { submitSettlement, nativeAssetContractId } from '../features/payments/settlementService';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/Spinner';
import { SettlementTicket, type TicketLine } from '../components/SettlementTicket';
import { getApiErrorMessage } from '../lib/api';

const XLM_TO_STROOPS = 10_000_000n;

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isConnected, address, connect, isConnecting } = useWalletAuth();
  const wallet = { address, connect, isConnecting };
  const { data: listing, isLoading } = useListing(id);
  const { data: pool } = usePool(listing?.poolId);
  const recordPayment = useRecordPayment();

  const [quantity, setQuantity] = useState(1);
  const [isSettling, setIsSettling] = useState(false);
  const [settledLines, setSettledLines] = useState<TicketLine[] | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const totalPrice = useMemo(
    () => (listing ? listing.pricePerUnit * quantity : 0),
    [listing, quantity],
  );

  const handleSettle = async () => {
    if (!listing || !pool) return;
    if (!isConnected) {
      toast.error('Connect your Freighter wallet to check out');
      return;
    }
    if (!wallet.address) {
      toast.error('Connect your Freighter wallet first');
      return;
    }

    setIsSettling(true);
    try {
      const amountStroops = (BigInt(Math.round(totalPrice * 1_000_000)) * XLM_TO_STROOPS) / 1_000_000n;
      const paymentId = `pay_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;

      const result = await submitSettlement({
        paymentId,
        poolId: listing.poolId,
        buyerAddress: wallet.address,
        tokenAddress: nativeAssetContractId(),
        amountStroops: amountStroops.toString(),
      });

      await recordPayment.mutateAsync({
        paymentId,
        poolId: listing.poolId,
        listingId: listing._id,
        buyerWallet: wallet.address,
        tokenAddress: nativeAssetContractId(),
        amount: amountStroops.toString(),
        transactionHash: result.transactionHash,
        ledgerTimestamp: result.ledgerTimestamp,
      });

      setSettledLines(
        pool.participants.map((p) => ({
          role: p.role,
          name: p.displayName,
          shareBps: p.shareBps,
          amount: ((totalPrice * p.shareBps) / 10_000).toFixed(2),
        })),
      );
      setTxHash(result.transactionHash);
      toast.success('Payment settled on-chain');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : getApiErrorMessage(error));
    } finally {
      setIsSettling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="font-display text-xl font-semibold">Listing not found</p>
        <Link to="/marketplace" className="mt-3 inline-block text-marigold-400 hover:underline">
          Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <div>
        <div className="aspect-[4/3] overflow-hidden rounded-xl bg-graphite-800">
          {listing.images[0] ? (
            <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-graphite-600">
              <PackageSearch className="h-10 w-10" aria-hidden />
            </div>
          )}
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">{listing.title}</h1>
        {listing.region && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-graphite-600">
            <MapPin className="h-4 w-4" aria-hidden /> {listing.region}
          </p>
        )}
        <p className="mt-4 text-graphite-600">{listing.description}</p>
        {pool && (
          <div className="mt-6 rounded-xl border border-graphite-700 bg-graphite-800 p-4">
            <p className="text-xs uppercase tracking-widest text-graphite-600">Settles through</p>
            <p className="mt-1 font-display font-semibold">{pool.cooperativeName}</p>
            <ul className="mt-3 space-y-1 text-sm text-graphite-600">
              {pool.participants.map((p) => (
                <li key={p.role} className="flex justify-between">
                  <span>{p.displayName}</span>
                  <span className="font-mono">{(p.shareBps / 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        {!settledLines ? (
          <div className="rounded-xl border border-graphite-700 bg-graphite-800 p-6">
            <p className="font-mono text-2xl font-semibold">
              {listing.pricePerUnit.toFixed(2)} <span className="text-sm text-graphite-600">XLM / {listing.unit}</span>
            </p>

            <label className="mt-6 block text-sm font-medium text-parchment-200" htmlFor="quantity">
              Quantity ({listing.unit})
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              max={listing.quantityAvailable}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(Number(e.target.value), listing.quantityAvailable)))}
              className="mt-1.5 h-11 w-full rounded-lg border border-graphite-600 bg-graphite-900 px-3.5 text-sm text-parchment-50 outline-none focus:border-marigold-500"
            />

            <div className="mt-5 flex items-baseline justify-between border-t border-graphite-700 pt-4">
              <span className="text-sm text-graphite-600">Total</span>
              <span className="font-mono text-xl font-semibold">{totalPrice.toFixed(2)} XLM</span>
            </div>

            {!wallet.address ? (
              <Button className="mt-6 w-full" onClick={() => wallet.connect('buyer', 'AgriPool User')} isLoading={wallet.isConnecting}>
                Connect wallet to pay
              </Button>
            ) : (
              <Button className="mt-6 w-full" onClick={handleSettle} isLoading={isSettling} disabled={listing.status !== 'active'}>
                {listing.status === 'active' ? 'Pay & settle on-chain' : 'No longer available'}
              </Button>
            )}
            <p className="mt-3 text-center text-xs text-graphite-600">
              One signature splits this payment between every participant instantly — no manual transfers.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <SettlementTicket
              poolLabel={pool?.cooperativeName ?? listing.poolId}
              totalAmount={totalPrice.toFixed(2)}
              lines={settledLines}
              settled
            />
            {txHash && (
              <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-sm text-marigold-400 hover:underline">
                View this settlement in the transaction explorer
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
