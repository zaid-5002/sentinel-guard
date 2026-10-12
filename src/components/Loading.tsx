import { Loader2 } from "lucide-react";

export function LoadingSpinner({ size = 16 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-indigo-400" />;
}

export function FullPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size={24} />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 animate-pulse">
      <div className="h-4 w-24 bg-zinc-800 rounded mb-4" />
      <div className="h-8 w-16 bg-zinc-800 rounded" />
    </div>
  );
}
