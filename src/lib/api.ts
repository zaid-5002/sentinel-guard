import {
  createGuard,
  type SentinelGuard,
  type ExecutionResult as GuardExecutionResult,
} from "@sentinel-guard/core";

export interface PolicyRule {
  decision: "allow" | "deny" | "approval-required";
  description?: string;
}

export interface PendingApproval {
  id: string;
  action: string;
  createdAt: number;
  status: "pending" | "approved" | "rejected";
  input: unknown;
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  action: string;
  decision: "allow" | "deny" | "approval-required";
  approvalId: string | null;
  approvalStatus: "pending" | "approved" | "rejected" | null;
  executionOutcome: "success" | "failed" | "not-executed";
  errorCode: string | null;
}

export interface ExecutionResult {
  status: "allowed" | "denied" | "approval-required" | "approved" | "rejected" | "error";
  action: string;
  decision: "allow" | "deny" | "approval-required";
  result?: unknown;
  approvalId?: string;
  error?: string;
}

export interface HealthStatus {
  status: "ok" | "error";
  timestamp?: number;
}

interface DemoState {
  files: Record<string, string>;
  deletedFiles: string[];
}

function createDemoState(): DemoState {
  return {
    files: {
      "sample.txt": "This is the content of sample.txt — a harmless demo file.",
      "notes.md": "# Demo Notes\n\nThis is a markdown file for demonstration.",
      "config.json": '{"app":"sentinel-guard","version":"0.1.0"}',
    },
    deletedFiles: [],
  };
}

function createGuardInstance(): SentinelGuard {
  const guard = createGuard({
    rules: {
      "file:read": {
        decision: "allow",
        description: "Read the contents of a simulated file",
      },
      "file:delete": {
        decision: "approval-required",
        description: "Delete a simulated file — requires explicit approval",
      },
      "secret:access": {
        decision: "deny",
        description: "Access a protected secret resource — always denied",
      },
    },
  });

  const state = createDemoState();

  guard.registerAction("file:read", async (input: unknown) => {
    const filename =
      typeof input === "object" && input !== null && "filename" in input
        ? String((input as Record<string, unknown>).filename)
        : "sample.txt";

    if (state.deletedFiles.includes(filename)) {
      throw new Error(`File "${filename}" has been deleted`);
    }

    const content = state.files[filename];
    if (content === undefined) {
      throw new Error(`File "${filename}" not found`);
    }
    return { filename, content };
  });

  guard.registerAction("file:delete", async (input: unknown) => {
    const filename =
      typeof input === "object" && input !== null && "filename" in input
        ? String((input as Record<string, unknown>).filename)
        : "sample.txt";

    if (state.deletedFiles.includes(filename)) {
      throw new Error(`File "${filename}" is already deleted`);
    }
    if (state.files[filename] === undefined) {
      throw new Error(`File "${filename}" not found`);
    }
    state.deletedFiles.push(filename);
    delete state.files[filename];
    return { filename, deleted: true };
  });

  guard.registerAction("secret:access", async () => {
    return { secret: "ACCESS DENIED — this handler should never run" };
  });

  return guard;
}

const guard = createGuardInstance();

function castResult<T>(r: GuardExecutionResult): T {
  return r as unknown as T;
}

export const api = {
  health: () =>
    Promise.resolve<HealthStatus>({ status: "ok", timestamp: Date.now() }),

  getPolicy: () =>
    Promise.resolve<{ rules: Record<string, PolicyRule> }>({
      rules: guard.getPolicy() as Record<string, PolicyRule>,
    }),

  getActions: () =>
    Promise.resolve<{ actions: string[] }>({
      actions: guard.getRegisteredActions(),
    }),

  execute: (action: string, input?: unknown) =>
    guard.execute(action, input).then((r) => castResult<ExecutionResult>(r)),

  getApprovals: () =>
    Promise.resolve<{ approvals: PendingApproval[] }>({
      approvals: guard.getPendingApprovals() as PendingApproval[],
    }),

  approve: (id: string) =>
    guard.approve(id).then((r) => castResult<ExecutionResult>(r)),

  reject: (id: string) =>
    Promise.resolve<{ status: string; action: string; approvalId: string }>(
      guard.reject(id) as { status: string; action: string; approvalId: string }
    ),

  getAudit: () =>
    Promise.resolve<{ events: AuditEvent[] }>({
      events: guard.getAuditLog() as AuditEvent[],
    }),
};
