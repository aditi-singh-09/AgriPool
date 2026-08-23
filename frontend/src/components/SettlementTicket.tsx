import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/cn';

export interface TicketLine {
  role: string;
  name: string;
  shareBps: number;
  amount: string;
}

interface SettlementTicketProps {
  poolLabel: string;
  totalAmount: string;
  currency?: string;
  lines: TicketLine[];
  settled?: boolean;
  className?: string;
}

/**
 * The platform's signature artifact: a weighbridge-style manifest that
 * shows one payment stamped and split into every participant's line item.
 * Used on the landing hero (illustrative), the checkout confirmation
 * (real), and the transaction explorer (real, on-chain data).
 */
export function SettlementTicket({
  poolLabel,
  totalAmount,
  currency = 'XLM',
  lines,
  settled = false,
  className,
}: SettlementTicketProps) {
  const [revealed, setRevealed] = useState(!settled);

  useEffect(() => {
    if (!settled) return;
    const timer = setTimeout(() => setRevealed(true), 350);
    return () => clearTimeout(timer);
  }, [settled]);

  return (
    <div className={cn('ticket w-full max-w-md px-6 pb-6 pt-7 font-mono', className)}>
      <div className="mb-4 flex items-start justify-between border-b border-dashed border-graphite-900/25 pb-3 font-body">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-graphite-700">Settlement manifest</p>
          <p className="font-display text-lg font-semibold leading-tight">{poolLabel}</p>
        </div>
        {settled && (
          <motion.span
            initial={{ scale: 1.6, opacity: 0, rotate: -16 }}
            animate={revealed ? { scale: 1, opacity: 1, rotate: -4 } : {}}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            className="stamp-seal border-stamp-500 text-stamp-500"
          >
            Settled
          </motion.span>
        )}
      </div>

      <div className="space-y-2.5">
        {lines.map((line, i) => (
          <motion.div
            key={line.role}
            initial={settled ? { opacity: 0, x: -8 } : false}
            animate={revealed ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: settled ? i * 0.12 : 0, duration: 0.35 }}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-graphite-700">{line.name}</span>
              <span className="text-[11px] text-graphite-700/60">{(line.shareBps / 100).toFixed(1)}%</span>
            </div>
            <span className="font-semibold tabular-nums">{line.amount}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-dashed border-graphite-900/25 pt-3 text-sm font-semibold">
        <span className="font-body uppercase tracking-wide text-graphite-700">Total settled</span>
        <span className="tabular-nums">
          {totalAmount} {currency}
        </span>
      </div>
    </div>
  );
}
