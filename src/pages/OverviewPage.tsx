import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  ShieldX,
  Clock,
  FileClock,
  ArrowRight,
  Activity,
} from "lucide-react";
import { api, type AuditEvent } from "@/lib/api";
import { Button } from "@/components/Button";
import { LoadingSpinner } from "@/components/Loading";
import { EmptyState } from "@/components/States";
import { DecisionBadge, OutcomeBadge } from "@/components/Badge";
import type { Route } from "@/lib/router";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function OverviewPage({ navigate }: { navigate: (r: Route) => void }) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
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

  const allowed = events.filter((e) => e.decision === "allow" && e.executionOutcome === "success").length;
  const denied = events.filter((e) => e.decision === "deny").length;
  const pending = events.filter(
    (e) => e.approvalStatus === "pending"
  ).length;
  const total = events.length;

  const recent = [...events].reverse().slice(0, 8);

  const stats = [
    { label: "Total Decisions", value: total, icon: Activity, color: "text-zinc-300" },
    { label: "Allowed", value: allowed, icon: ShieldCheck, color: "text-emerald-400" },
    { label: "Denied", value: denied, icon: ShieldX, color: "text-red-400" },
    { label: "Pending Approvals", value: pending, icon: Clock, color: "text-amber-400" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-500">{stat.label}</span>
                <Icon size={16} className={stat.color} />
              </div>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent events */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <FileClock size={16} className="text-zinc-500" />
            <h3 className="text-sm font-medium">Recent Security Events</h3>
          </div>
          <button
            onClick={() => navigate("audit")}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        {error ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-zinc-500">Failed to load audit data.</p>
            <button onClick={load} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">
              Try again
            </button>
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            title="No events recorded yet"
            description="Execute actions in the Permission Tester to see decisions appear here."
            action={
              <Button size="sm" onClick={() => navigate("tester")}>
                Go to Permission Tester <ArrowRight size={14} />
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {recent.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/20 transition-colors"
              >
                <span className="text-xs text-zinc-500 tabular-nums w-20 shrink-0">
                  {formatTime(event.timestamp)}
                </span>
                <span className="text-sm text-zinc-300 font-mono flex-1 truncate">
                  {event.action}
                </span>
                <DecisionBadge decision={event.decision} />
                <OutcomeBadge outcome={event.executionOutcome} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick link */}
      <div className="rounded-xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/60 to-zinc-900/20 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-medium">Try the Permission Tester</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Execute demo actions and see the enforcement engine in action.
            </p>
          </div>
          <Button onClick={() => navigate("tester")}>
            Open Tester <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
