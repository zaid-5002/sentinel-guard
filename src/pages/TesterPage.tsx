import { useState, useEffect, useCallback } from "react";
import { Play, Loader2, ArrowRight, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { api, type ExecutionResult, type PolicyRule } from "@/lib/api";
import { Button } from "@/components/Button";
import { DecisionBadge, StatusBadge } from "@/components/Badge";
import { useToast } from "@/components/Toast";
import type { Route } from "@/lib/router";

const actionMeta: Record<
  string,
  { label: string; description: string; inputField?: { name: string; label: string; placeholder: string; defaultValue: string } }
> = {
  "file:read": {
    label: "File Read",
    description: "Read the contents of a simulated file. This action is allowed by policy.",
    inputField: {
      name: "filename",
      label: "Filename",
      placeholder: "sample.txt",
      defaultValue: "sample.txt",
    },
  },
  "file:delete": {
    label: "File Delete",
    description: "Delete a simulated file. This action requires approval before execution.",
    inputField: {
      name: "filename",
      label: "Filename",
      placeholder: "sample.txt",
      defaultValue: "sample.txt",
    },
  },
  "secret:access": {
    label: "Secret Access",
    description: "Attempt to access a protected secret resource. This action is denied by policy.",
  },
};

export function TesterPage({ navigate }: { navigate: (r: Route) => void }) {
  const { notify } = useToast();
  const [actions, setActions] = useState<string[]>([]);
  const [policy, setPolicy] = useState<Record<string, PolicyRule>>({});
  const [selected, setSelected] = useState("file:read");
  const [inputValue, setInputValue] = useState("sample.txt");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);

  const load = useCallback(async () => {
    try {
      const [actionsRes, policyRes] = await Promise.all([
        api.getActions(),
        api.getPolicy(),
      ]);
      setActions(actionsRes.actions);
      setPolicy(policyRes.rules);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const meta = actionMeta[selected];
  const rule = policy[selected];

  const handleSelect = (action: string) => {
    setSelected(action);
    setResult(null);
    const m = actionMeta[action];
    setInputValue(m?.inputField?.defaultValue ?? "");
  };

  const handleExecute = async () => {
    setLoading(true);
    setResult(null);
    try {
      const input =
        meta?.inputField ? { [meta.inputField.name]: inputValue } : undefined;
      const res = await api.execute(selected, input);
      setResult(res);

      if (res.status === "allowed") {
        notify("success", `Action "${selected}" executed successfully`);
      } else if (res.status === "denied") {
        notify("error", `Action "${selected}" was denied by policy`);
      } else if (res.status === "approval-required") {
        notify("warning", `Action "${selected}" requires approval`);
      } else if (res.status === "error") {
        notify("error", `Action "${selected}" failed: ${res.error}`);
      }
    } catch {
      notify("error", "Failed to communicate with backend");
    } finally {
      setLoading(false);
    }
  };

  const resultIcon = (status: string) => {
    switch (status) {
      case "allowed":
      case "approved":
        return <CheckCircle2 size={20} className="text-emerald-400" />;
      case "denied":
      case "rejected":
        return <XCircle size={20} className="text-red-400" />;
      case "approval-required":
        return <Clock size={20} className="text-amber-400" />;
      case "error":
        return <AlertTriangle size={20} className="text-red-400" />;
      default:
        return null;
    }
  };

  const resultExplanation = (r: ExecutionResult): string => {
    switch (r.status) {
      case "allowed":
        return "The policy engine permitted this action. The registered handler executed and returned a result.";
      case "denied":
        return "The policy engine denied this action. The handler was never invoked.";
      case "approval-required":
        return "The policy engine suspended this action. It will not execute until an authorized user approves the pending request.";
      case "approved":
        return "The pending request was approved. The handler executed exactly once and returned a result.";
      case "rejected":
        return "The pending request was rejected. The handler will never execute for this request.";
      case "error":
        return "The handler was invoked but threw an error. The failure was recorded in the audit log.";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Action selector */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6">
        <h3 className="text-sm font-medium mb-4">Select an action</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {actions.map((action) => {
            const m = actionMeta[action];
            const isActive = selected === action;
            const decision = policy[action]?.decision;
            return (
              <button
                key={action}
                onClick={() => handleSelect(action)}
                className={`text-left p-4 rounded-lg border transition-all duration-150 ${
                  isActive
                    ? "border-indigo-500/40 bg-indigo-600/10"
                    : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-200">
                    {m?.label ?? action}
                  </span>
                  {decision && <DecisionBadge decision={decision} />}
                </div>
                <p className="text-xs text-zinc-500 line-clamp-2">
                  {m?.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input + execute */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6">
        <h3 className="text-sm font-medium mb-4">Action details</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Action</label>
            <code className="text-sm text-indigo-300 font-mono bg-zinc-950/60 px-3 py-1.5 rounded-md border border-zinc-800 inline-block">
              {selected}
            </code>
          </div>

          {meta?.inputField && (
            <div>
              <label htmlFor="input-value" className="text-xs text-zinc-500 mb-1.5 block">
                {meta.inputField.label}
              </label>
              <input
                id="input-value"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={meta.inputField.placeholder}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
              />
            </div>
          )}

          {rule?.description && (
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Policy Description</label>
              <p className="text-sm text-zinc-400">{rule.description}</p>
            </div>
          )}

          <Button
            onClick={handleExecute}
            disabled={loading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Executing...
              </>
            ) : (
              <>
                <Play size={16} /> Run Action
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800/80">
            {resultIcon(result.status)}
            <h3 className="text-sm font-medium flex-1">Execution Result</h3>
            <StatusBadge status={result.status} />
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Action</label>
                <code className="text-sm text-zinc-300 font-mono">{result.action}</code>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Policy Decision</label>
                <DecisionBadge decision={result.decision} />
              </div>
            </div>

            {result.approvalId && (
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Approval Request ID</label>
                <code className="text-sm text-amber-300 font-mono break-all bg-zinc-950/60 px-3 py-1.5 rounded-md border border-zinc-800 inline-block">
                  {result.approvalId}
                </code>
                <button
                  onClick={() => navigate("approvals")}
                  className="ml-3 text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                >
                  Go to Approval Center <ArrowRight size={12} />
                </button>
              </div>
            )}

            {result.result !== undefined && (
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Response Data</label>
                <pre className="text-sm text-zinc-300 font-mono bg-zinc-950/60 p-4 rounded-lg border border-zinc-800 overflow-x-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            )}

            {result.error && (
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Error</label>
                <p className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                  {result.error}
                </p>
              </div>
            )}

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Explanation</label>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {resultExplanation(result)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
