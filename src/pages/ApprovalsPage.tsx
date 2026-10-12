import { useEffect, useState, useCallback } from "react";
import { CheckSquare, RefreshCw, Check, X, Loader2, Clock } from "lucide-react";
import { api, type PendingApproval, type ExecutionResult } from "@/lib/api";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { LoadingSpinner } from "@/components/Loading";
import { EmptyState, ErrorState } from "@/components/States";
import { useToast } from "@/components/Toast";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function ApprovalsPage() {
  const { notify } = useToast();
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    id: string;
    result: ExecutionResult | { status: string; action: string; approvalId: string };
  } | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const data = await api.getApprovals();
      setApprovals(data.approvals);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const handleApprove = async (id: string) => {
    setPendingAction(id);
    setLastResult(null);
    try {
      const result = await api.approve(id);
      setLastResult({ id, result });
      if (result.status === "approved") {
        notify("success", "Request approved — action executed");
      } else if (result.status === "error") {
        notify("error", `Approval succeeded but handler failed: ${result.error}`);
      }
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to approve";
      notify("error", message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleReject = async (id: string) => {
    setPendingAction(id);
    setLastResult(null);
    try {
      const result = await api.reject(id);
      setLastResult({ id, result });
      notify("info", "Request rejected — action will not execute");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reject";
      notify("error", message);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CheckSquare size={16} className="text-indigo-400" />
          <p className="text-sm text-zinc-400">
            {approvals.length} pending request{approvals.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size={24} />
        </div>
      ) : error ? (
        <ErrorState message="Could not load pending approvals." onRetry={load} />
      ) : approvals.length === 0 ? (
        <EmptyState
          icon={<Clock size={32} />}
          title="No pending approvals"
          description="Approval-required actions will appear here. Try executing the File Delete action in the Permission Tester."
        />
      ) : (
        <div className="space-y-3">
          {approvals.map((approval) => {
            const isPending = pendingAction === approval.id;
            const result = lastResult?.id === approval.id ? lastResult.result : null;
            return (
              <div
                key={approval.id}
                className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="pending" />
                      <code className="text-sm text-zinc-200 font-mono">
                        {approval.action}
                      </code>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">Request ID</label>
                      <p className="text-xs text-zinc-400 font-mono break-all mt-0.5">
                        {approval.id}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">Created</label>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {formatTime(approval.createdAt)}
                      </p>
                    </div>
                    {approval.input != null && typeof approval.input === "object" && (
                      <div>
                        <label className="text-xs text-zinc-500">Input</label>
                        <pre className="text-xs text-zinc-400 font-mono bg-zinc-950/60 p-2 rounded-md border border-zinc-800 mt-0.5 inline-block">
                          {String(JSON.stringify(approval.input))}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApprove(approval.id)}
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(approval.id)}
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                      Reject
                    </Button>
                  </div>
                </div>

                {/* Result */}
                {result && (
                  <div className="mt-4 pt-4 border-t border-zinc-800/60">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-zinc-500">Outcome:</span>
                      <Badge variant={result.status === "approved" ? "approved" : result.status === "rejected" ? "rejected" : "error"}>
                        {result.status}
                      </Badge>
                    </div>
                    {"result" in result && result.result != null && (
                      <pre className="text-xs text-zinc-300 font-mono bg-zinc-950/60 p-3 rounded-md border border-zinc-800 overflow-x-auto">
                        {String(JSON.stringify(result.result, null, 2))}
                      </pre>
                    )}
                    {"error" in result && result.error && (
                      <p className="text-xs text-red-400">{result.error}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
