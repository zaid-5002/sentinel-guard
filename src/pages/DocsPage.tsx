import { useState } from "react";
import { Copy, Check, BookOpen, Package, Code, Shield, AlertTriangle } from "lucide-react";

function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative group">
      {title && (
        <div className="text-xs text-zinc-500 mb-1.5 font-medium">{title}</div>
      )}
      <div className="relative rounded-lg border border-zinc-800 bg-zinc-950/80 overflow-hidden">
        <button
          onClick={copy}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          title="Copy to clipboard"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
        <pre className="text-sm text-zinc-300 font-mono p-4 pr-12 overflow-x-auto leading-relaxed">
          {code}
        </pre>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-indigo-400">{icon}</span>
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      </div>
      <div className="space-y-3 pl-6">{children}</div>
    </section>
  );
}

export function DocsPage() {
  return (
    <div className="max-w-3xl space-y-10">
      <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/80">
        <BookOpen size={18} className="text-indigo-400" />
        <h2 className="text-base font-semibold">Developer Guide</h2>
      </div>

      <Section icon={<Package size={16} />} title="Installation">
        <p className="text-sm text-zinc-400 leading-relaxed">
          Sentinel Guard is locally installed as a workspace package. The playground
          runs the enforcement engine directly in the browser — no server required.
        </p>
        <CodeBlock code={`npm install @sentinel-guard/core`} title="If published to npm" />
        <CodeBlock
          code={`# Local workspace reference
"dependencies": {
  "@sentinel-guard/core": "workspace:*"
}`}
          title="In package.json (monorepo)"
        />
      </Section>

      <Section icon={<Code size={16} />} title="Import & Create a Guard">
        <CodeBlock
          code={`import { createGuard } from "@sentinel-guard/core";

const guard = createGuard({
  rules: {
    "file:read": "allow",
    "file:delete": "approval-required",
    "secret:access": "deny"
  }
});`}
        />
      </Section>

      <Section icon={<Shield size={16} />} title="Register Actions">
        <p className="text-sm text-zinc-400 leading-relaxed">
          Register named actions with async handlers. Only registered handlers can execute —
          arbitrary code from requests is never accepted.
        </p>
        <CodeBlock
          code={`guard.registerAction("file:read", async (input) => {
  return { content: "file contents here" };
});

guard.registerAction("file:delete", async (input) => {
  return { deleted: true };
});`}
        />
      </Section>

      <Section icon={<Code size={16} />} title="Execute Actions">
        <p className="text-sm text-zinc-400 leading-relaxed">
          Every action passes through the policy engine before its handler runs.
          The result tells you whether it was allowed, denied, or needs approval.
        </p>
        <CodeBlock
          code={`const result = await guard.execute("file:read", {
  filename: "sample.txt"
});

// result.status: "allowed" | "denied" | "approval-required"
// result.result: handler return value (if allowed)
// result.approvalId: pending request ID (if approval required)`}
        />
      </Section>

      <Section icon={<Shield size={16} />} title="Approval Handling">
        <p className="text-sm text-zinc-400 leading-relaxed">
          Approval-required actions create a pending request. The caller must explicitly
          approve or reject it. Approved actions execute exactly once.
        </p>
        <CodeBlock
          code={`// List pending approvals
const pending = guard.getPendingApprovals();

// Approve — executes the handler once
const result = await guard.approve(approvalId);

// Reject — never executes the handler
guard.reject(approvalId);`}
        />
      </Section>

      <Section icon={<Code size={16} />} title="Audit Logging">
        <p className="text-sm text-zinc-400 leading-relaxed">
          Every permission check and execution attempt is recorded. Audit entries
          never contain input values, secrets, or credentials.
        </p>
        <CodeBlock
          code={`const log = guard.getAuditLog();

// Each entry contains:
// - id, timestamp, action
// - decision (policy)
// - approvalId, approvalStatus
// - executionOutcome: "success" | "failed" | "not-executed"
// - errorCode`}
        />
      </Section>

      <Section icon={<AlertTriangle size={16} />} title="Known Limitations">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 space-y-2">
          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
            <li>In-memory state: pending requests, audit logs, and demo resources reset when the page reloads.</li>
            <li>Client-side execution: the enforcement engine runs in the browser for demonstration purposes.</li>
            <li>No persistence layer: all data is ephemeral by design.</li>
            <li>This is a permission-enforcement library, not a complete security solution. In production, the guard should run on the server.</li>
          </ul>
        </div>
      </Section>

      <Section icon={<Shield size={16} />} title="Permission Decision vs Enforcement">
        <p className="text-sm text-zinc-400 leading-relaxed">
          A <span className="text-zinc-200 font-medium">policy decision</span> determines
          whether an action is allowed, denied, or requires approval. <span className="text-zinc-200 font-medium">Enforcement</span> is the
          act of actually executing or blocking the action based on that decision. Sentinel Guard
          performs both: it evaluates the policy and then enforces the outcome — the handler
          only runs if the policy permits it.
        </p>
      </Section>
    </div>
  );
}
