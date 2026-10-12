import type { ReactNode } from "react";
import { Inbox, AlertTriangle } from "lucide-react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 text-zinc-600">
        {icon ?? <Inbox size={32} />}
      </div>
      <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
      {description && (
        <p className="mt-1.5 text-xs text-zinc-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 text-red-500/60">
        <AlertTriangle size={32} />
      </div>
      <h3 className="text-sm font-medium text-zinc-300">Something went wrong</h3>
      <p className="mt-1.5 text-xs text-zinc-500 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
