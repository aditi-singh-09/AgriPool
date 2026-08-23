import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sprout, Truck, Warehouse, Users, ShieldCheck, Radio } from 'lucide-react';
import { SettlementTicket } from '../components/SettlementTicket';
import { Button } from '../components/ui/Button';

const exampleLines = [
  { role: 'farmer', name: 'Farmer collective', shareBps: 6000, amount: '600.00' },
  { role: 'cooperative', name: 'Valley Cooperative', shareBps: 2000, amount: '200.00' },
  { role: 'transport', name: 'Fast Transport Co.', shareBps: 1000, amount: '100.00' },
  { role: 'warehouse', name: 'Central Warehouse', shareBps: 1000, amount: '100.00' },
];

const roles = [
  { icon: Sprout, label: 'Farmers', detail: 'Paid their exact share the moment the buyer settles — no waiting on a manager.' },
  { icon: Users, label: 'Cooperative', detail: 'Keeps its cut automatically, with every distribution visible to every member.' },
  { icon: Truck, label: 'Transport', detail: 'Gets paid for the haul in the same transaction as the sale.' },
  { icon: Warehouse, label: 'Warehouse', detail: 'Storage fees settle instantly, with no separate invoice to chase.' },
];

export function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6">
      <section className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="stamp-seal border-ledger-500 text-ledger-400">Stellar testnet · Soroban</span>
          <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.1] sm:text-5xl">
            One payment. Split instantly, transparently, on-chain.
          </h1>
          <p className="mt-5 max-w-lg text-balance text-graphite-600">
            AgriPool replaces the cooperative manager who manually wires everyone's cut. A buyer signs one
            transaction; the Soroban contract divides it between farmers, the cooperative, transport, and
            the warehouse in the same atomic call — so nobody waits, and nobody has to trust a middleman.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/marketplace">
              <Button size="lg">
                Browse the marketplace
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
            <Link to="/explorer">
              <Button size="lg" variant="secondary">
                View the transaction explorer
              </Button>
            </Link>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex justify-center lg:justify-end"
        >
          <SettlementTicket
            poolLabel="Valley Cooperative · Pool #a114"
            totalAmount="1,000.00"
            lines={exampleLines}
            settled
          />
        </motion.div>
      </section>

      <section className="mt-28">
        <h2 className="text-center font-display text-2xl font-semibold">Four parties, one settlement</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-graphite-600">
          Every cooperative defines its split once. From then on, every sale pays all four parties in the
          same transaction — automatically, and identically every time.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map(({ icon: Icon, label, detail }) => (
            <div key={label} className="rounded-xl border border-graphite-700 bg-graphite-800 p-5">
              <Icon className="h-6 w-6 text-marigold-500" aria-hidden />
              <p className="mt-3 font-display text-lg font-semibold">{label}</p>
              <p className="mt-1.5 text-sm text-graphite-600">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-28 grid gap-6 rounded-2xl border border-graphite-700 bg-graphite-800 p-8 sm:grid-cols-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ledger-400" aria-hidden />
          <div>
            <p className="font-display font-semibold">No double payments</p>
            <p className="mt-1 text-sm text-graphite-600">
              Every settlement is keyed to a unique payment ID the contract checks before moving a single
              stroop.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Radio className="mt-0.5 h-5 w-5 shrink-0 text-ledger-400" aria-hidden />
          <div>
            <p className="font-display font-semibold">Fully auditable</p>
            <p className="mt-1 text-sm text-graphite-600">
              Every split, every wallet, and every historical settlement is readable directly from the
              contract — by anyone, anytime.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Sprout className="mt-0.5 h-5 w-5 shrink-0 text-ledger-400" aria-hidden />
          <div>
            <p className="font-display font-semibold">Renegotiate freely</p>
            <p className="mt-1 text-sm text-graphite-600">
              Cooperatives can update participant shares between seasons — past settlements stay exactly
              as they happened.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
