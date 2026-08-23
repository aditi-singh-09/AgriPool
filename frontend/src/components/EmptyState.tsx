import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-graphite-600 px-6 py-16 text-center">
      <Icon className="h-8 w-8 text-graphite-600" aria-hidden />
      <p className="font-display text-lg font-semibold text-parchment-100">{title}</p>
      <p className="max-w-sm text-sm text-graphite-600">{description}</p>
      {action}
    </div>
  );
}
