import type { LucideIcon } from 'lucide-react';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon = AlertCircle, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 px-6 text-center">
      <Icon size={40} className="text-slate-300 mb-3" />
      <p className="text-slate-500 text-sm mb-4">{message}</p>
      {actionLabel && onAction && (
        <button className="btn-primary text-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
