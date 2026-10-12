export type PolicyDecision = "allow" | "deny" | "approval-required";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ExecutionOutcome = "success" | "failed" | "not-executed";

export type GuardStatus =
  | "allowed"
  | "denied"
  | "approval-required"
  | "approved"
  | "rejected"
  | "error";

export interface PolicyRule {
  decision: PolicyDecision;
  description?: string;
}

export type PolicyConfig = Record<string, PolicyDecision | PolicyRule>;

export interface PendingApproval {
  id: string;
  action: string;
  createdAt: number;
  status: ApprovalStatus;
  input: unknown;
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  action: string;
  decision: PolicyDecision;
  approvalId: string | null;
  approvalStatus: ApprovalStatus | null;
  executionOutcome: ExecutionOutcome;
  errorCode: string | null;
}

export interface ExecutionResult<T = unknown> {
  status: GuardStatus;
  action: string;
  decision: PolicyDecision;
  result?: T;
  approvalId?: string;
  error?: string;
}

export type ActionHandler<TInput = unknown, TResult = unknown> = (
  input: TInput
) => Promise<TResult> | TResult;

export interface GuardOptions {
  rules: PolicyConfig;
}
