export { createGuard, SentinelGuard } from "./guard.js";
export {
  GuardError,
  UnknownActionError,
  DeniedActionError,
  ApprovalNotFoundError,
  InvalidApprovalStateError,
  InvalidPolicyError,
  HandlerError,
} from "./errors.js";
export type {
  PolicyDecision,
  ApprovalStatus,
  ExecutionOutcome,
  GuardStatus,
  PolicyRule,
  PolicyConfig,
  PendingApproval,
  AuditEvent,
  ExecutionResult,
  ActionHandler,
  GuardOptions,
} from "./types.js";
