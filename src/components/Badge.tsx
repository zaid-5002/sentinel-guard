import type { ReactNode } from "react";

type BadgeVariant =
  | "allow"
  | "deny"
  | "approval"
  | "pending"
  | "approved"
  | "rejected"
  | "success"
  | "failed"
  | "not-executed"
  | "error"
  | "info";

const variantStyles: Record<BadgeVariant, string> = {
  allow: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  deny: "bg-red-500/10 text-red-400 border-red-500/20",
  approval: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  "not-executed": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const variantLabels: Record<BadgeVariant, string> = {
  allow: "Allow",
  deny: "Deny",
  approval: "Approval Required",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  success: "Success",
  failed: "Failed",
  "not-executed": "Not Executed",
  error: "Error",
  info: "Info",
};

export function Badge({
  variant,
  children,
}: {
  variant: BadgeVariant;
  children?: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children ?? variantLabels[variant]}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: string }) {
  const map: Record<string, BadgeVariant> = {
    allow: "allow",
    deny: "deny",
    "approval-required": "approval",
  };
  return <Badge variant={map[decision] ?? "info"} />;
}

export function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, BadgeVariant> = {
    success: "success",
    failed: "failed",
    "not-executed": "not-executed",
  };
  return <Badge variant={map[outcome] ?? "info"} />;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    allowed: "allow",
    denied: "deny",
    "approval-required": "approval",
    approved: "approved",
    rejected: "rejected",
    pending: "pending",
    error: "error",
  };
  return <Badge variant={map[status] ?? "info"} />;
}
