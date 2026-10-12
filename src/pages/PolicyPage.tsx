import { useEffect, useState, useCallback } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { api, type PolicyRule } from "@/lib/api";
import { DecisionBadge } from "@/components/Badge";
import { LoadingSpinner } from "@/components/Loading";
import { ErrorState, EmptyState } from "@/components/States";
import { Button } from "@/components/Button";

export function PolicyPage() {
  const [rules, setRules] = useState<Record<string, PolicyRule>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.getPolicy();
      setRules(data.rules);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const entries = Object.entries(rules);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Shield size={16} className="text-indigo-400" />
          <p className="text-sm text-zinc-400">
            {entries.length} rule{entries.length !== 1 ? "s" : ""} configured
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
        <ErrorState message="Could not load policy rules from the backend." onRetry={load} />
      ) : entries.length === 0 ? (
        <EmptyState title="No policy rules configured" />
      ) : (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/80">
                <th className="text-left text-xs font-medium text-zinc-500 px-5 py-3">Action</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-5 py-3">Decision</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-5 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {entries.map(([action, rule]) => (
                <tr key={action} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-5 py-3">
                    <code className="text-sm text-zinc-200 font-mono">{action}</code>
                  </td>
                  <td className="px-5 py-3">
                    <DecisionBadge decision={rule.decision} />
                  </td>
                  <td className="px-5 py-3 text-sm text-zinc-400">
                    {rule.description ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Default deny notice */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-5 py-4">
        <h4 className="text-sm font-medium text-amber-300 mb-1">Default Deny</h4>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Any action not listed above is automatically denied. This ensures that
          unconfigured or unknown actions cannot execute unless explicitly allowed by policy.
        </p>
      </div>
    </div>
  );
}
