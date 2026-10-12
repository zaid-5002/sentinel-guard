import { useEffect, useState, useCallback, useMemo } from "react";
import { FileClock, RefreshCw, Search } from "lucide-react";
import { api, type AuditEvent } from "@/lib/api";
import { Button } from "@/components/Button";
import { DecisionBadge, OutcomeBadge, Badge } from "@/components/Badge";
import { LoadingSpinner } from "@/components/Loading";
import { EmptyState, ErrorState } from "@/components/States";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

type FilterValue = "all" | "allow" | "deny" | "approval-required" | "success" | "failed";

export function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.getAudit();
      setEvents(data.events);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let result = [...events].reverse();
    if (filter !== "all") {
      result = result.filter(
        (e) =>
          e.decision === filter ||
          e.executionOutcome === filter
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.action.toLowerCase().includes(q) ||
          e.errorCode?.toLowerCase().includes(q) ||
          e.approvalId?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [events, filter, search]);

  const filters: { value: FilterValue; label: string }[] = [
    { value: "all", label: "All" },
    { value: "allow", label: "Allowed" },
    { value: "deny", label: "Denied" },
    { value: "approval-required", label: "Approval" },
    { value: "success", label: "Success" },
    { value: "failed", label: "Failed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <FileClock size={16} className="text-indigo-400" />
          <p className="text-sm text-zinc-400">
            {events.length} event{events.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, error code, or approval ID..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                filter === f.value
                  ? "bg-indigo-600/10 text-indigo-300 border-indigo-500/30"
                  : "bg-zinc-900/40 text-zinc-500 border-zinc-800 hover:text-zinc-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size={24} />
        </div>
      ) : error ? (
        <ErrorState message="Could not load audit log." onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={events.length === 0 ? "No audit events yet" : "No matching events"}
          description={
            events.length === 0
              ? "Execute actions to generate audit records."
              : "Try adjusting your search or filter."
          }
        />
      ) : (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-zinc-800/80">
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Timestamp</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Action</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Decision</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Approval</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Outcome</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((event) => (
                <tr key={event.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-zinc-500 tabular-nums whitespace-nowrap">
                    {formatTime(event.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-sm text-zinc-200 font-mono">{event.action}</code>
                  </td>
                  <td className="px-4 py-3">
                    <DecisionBadge decision={event.decision} />
                  </td>
                  <td className="px-4 py-3">
                    {event.approvalStatus ? (
                      <Badge variant={event.approvalStatus as "pending" | "approved" | "rejected"}>
                        {event.approvalStatus}
                      </Badge>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <OutcomeBadge outcome={event.executionOutcome} />
                  </td>
                  <td className="px-4 py-3">
                    {event.errorCode ? (
                      <code className="text-xs text-red-400/80 font-mono">{event.errorCode}</code>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
