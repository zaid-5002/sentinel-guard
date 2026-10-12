import type {
  ActionHandler,
  AuditEvent,
  ExecutionResult,
  GuardOptions,
  PendingApproval,
  PolicyConfig,
  PolicyDecision,
  PolicyRule,
  ApprovalStatus,
} from "./types";
import {
  InvalidApprovalStateError,
  InvalidPolicyError,
  UnknownActionError,
  ApprovalNotFoundError,
} from "./errors";

const VALID_DECISIONS: readonly PolicyDecision[] = [
  "allow",
  "deny",
  "approval-required",
];

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function normalizePolicy(config: PolicyConfig): Map<string, PolicyRule> {
  const map = new Map<string, PolicyRule>();
  for (const [action, value] of Object.entries(config)) {
    let rule: PolicyRule;
    if (typeof value === "string") {
      if (!VALID_DECISIONS.includes(value)) {
        throw new InvalidPolicyError(
          `Invalid decision "${value}" for action "${action}"`
        );
      }
      rule = { decision: value };
    } else {
      if (!VALID_DECISIONS.includes(value.decision)) {
        throw new InvalidPolicyError(
          `Invalid decision "${value.decision}" for action "${action}"`
        );
      }
      rule = { decision: value.decision, description: value.description };
    }
    map.set(action, rule);
  }
  return map;
}

interface PendingRequest {
  id: string;
  action: string;
  input: unknown;
  createdAt: number;
  status: ApprovalStatus;
}

export class SentinelGuard {
  private rules: Map<string, PolicyRule>;
  private handlers = new Map<string, ActionHandler>();
  private pending = new Map<string, PendingRequest>();
  private audit: AuditEvent[] = [];
  private executedApprovals = new Set<string>();

  constructor(options: GuardOptions) {
    this.rules = normalizePolicy(options.rules);
  }

  registerAction<TInput, TResult>(
    action: string,
    handler: ActionHandler<TInput, TResult>
  ): void {
    this.handlers.set(action, handler as ActionHandler);
  }

  getPolicy(): Record<string, PolicyRule> {
    const result: Record<string, PolicyRule> = {};
    for (const [action, rule] of this.rules) {
      result[action] = { ...rule };
    }
    return result;
  }

  getRegisteredActions(): string[] {
    return Array.from(this.handlers.keys());
  }

  private getDecision(action: string): PolicyDecision {
    const rule = this.rules.get(action);
    return rule ? rule.decision : "deny";
  }

  private addAudit(event: Omit<AuditEvent, "id" | "timestamp">): void {
    this.audit.push({
      id: generateId(),
      timestamp: Date.now(),
      ...event,
    });
  }

  async execute<T = unknown>(
    action: string,
    input?: unknown
  ): Promise<ExecutionResult<T>> {
    const decision = this.getDecision(action);

    if (decision === "deny") {
      this.addAudit({
        action,
        decision,
        approvalId: null,
        approvalStatus: null,
        executionOutcome: "not-executed",
        errorCode: "DENIED",
      });
      return {
        status: "denied",
        action,
        decision,
        error: "Action denied by policy",
      };
    }

    if (decision === "approval-required") {
      const id = generateId();
      const request: PendingRequest = {
        id,
        action,
        input,
        createdAt: Date.now(),
        status: "pending",
      };
      this.pending.set(id, request);
      this.addAudit({
        action,
        decision,
        approvalId: id,
        approvalStatus: "pending",
        executionOutcome: "not-executed",
        errorCode: null,
      });
      return {
        status: "approval-required",
        action,
        decision,
        approvalId: id,
      };
    }

    // decision === "allow"
    return this.executeHandler<T>(action, input);
  }

  private async executeHandler<T>(
    action: string,
    input: unknown,
    approvalId: string | null = null
  ): Promise<ExecutionResult<T>> {
    const handler = this.handlers.get(action);
    if (!handler) {
      this.addAudit({
        action,
        decision: this.getDecision(action),
        approvalId,
        approvalStatus: approvalId ? "approved" : null,
        executionOutcome: "not-executed",
        errorCode: "UNKNOWN_ACTION",
      });
      throw new UnknownActionError(action);
    }

    try {
      const result = await handler(input);
      this.addAudit({
        action,
        decision: this.getDecision(action),
        approvalId,
        approvalStatus: approvalId ? "approved" : null,
        executionOutcome: "success",
        errorCode: null,
      });
      return {
        status: approvalId ? "approved" : "allowed",
        action,
        decision: this.getDecision(action),
        result: result as T,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown handler error";
      this.addAudit({
        action,
        decision: this.getDecision(action),
        approvalId,
        approvalStatus: approvalId ? "approved" : null,
        executionOutcome: "failed",
        errorCode: "HANDLER_ERROR",
      });
      return {
        status: "error",
        action,
        decision: this.getDecision(action),
        error: message,
      };
    }
  }

  getPendingApprovals(): PendingApproval[] {
    return Array.from(this.pending.values())
      .filter((r) => r.status === "pending")
      .map((r) => ({
        id: r.id,
        action: r.action,
        createdAt: r.createdAt,
        status: r.status,
        input: r.input,
      }));
  }

  async approve<T = unknown>(
    approvalId: string
  ): Promise<ExecutionResult<T>> {
    const request = this.pending.get(approvalId);
    if (!request) {
      throw new ApprovalNotFoundError(approvalId);
    }
    if (request.status !== "pending") {
      throw new InvalidApprovalStateError(approvalId, request.status);
    }
    if (this.executedApprovals.has(approvalId)) {
      throw new InvalidApprovalStateError(approvalId, "already executed");
    }

    this.executedApprovals.add(approvalId);
    request.status = "approved";

    const result = await this.executeHandler<T>(
      request.action,
      request.input,
      approvalId
    );
    return result;
  }

  reject(approvalId: string): { status: "rejected"; action: string; approvalId: string } {
    const request = this.pending.get(approvalId);
    if (!request) {
      throw new ApprovalNotFoundError(approvalId);
    }
    if (request.status !== "pending") {
      throw new InvalidApprovalStateError(approvalId, request.status);
    }
    request.status = "rejected";
    this.addAudit({
      action: request.action,
      decision: this.getDecision(request.action),
      approvalId,
      approvalStatus: "rejected",
      executionOutcome: "not-executed",
      errorCode: null,
    });
    return {
      status: "rejected",
      action: request.action,
      approvalId,
    };
  }

  getAuditLog(): AuditEvent[] {
    return [...this.audit];
  }

  clearAuditLog(): void {
    this.audit = [];
  }
}

export function createGuard(options: GuardOptions): SentinelGuard {
  return new SentinelGuard(options);
}


