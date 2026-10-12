export class GuardError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "GuardError";
  }
}

export class UnknownActionError extends GuardError {
  constructor(action: string) {
    super("UNKNOWN_ACTION", `Action "${action}" is not registered`);
    this.name = "UnknownActionError";
  }
}

export class DeniedActionError extends GuardError {
  constructor(action: string) {
    super("DENIED", `Action "${action}" is denied by policy`);
    this.name = "DeniedActionError";
  }
}

export class ApprovalNotFoundError extends GuardError {
  constructor(id: string) {
    super("APPROVAL_NOT_FOUND", `Approval request "${id}" does not exist`);
    this.name = "ApprovalNotFoundError";
  }
}

export class InvalidApprovalStateError extends GuardError {
  constructor(id: string, currentStatus: string) {
    super(
      "INVALID_APPROVAL_STATE",
      `Approval request "${id}" is already ${currentStatus}`
    );
    this.name = "InvalidApprovalStateError";
  }
}

export class InvalidPolicyError extends GuardError {
  constructor(message: string) {
    super("INVALID_POLICY", message);
    this.name = "InvalidPolicyError";
  }
}

export class HandlerError extends GuardError {
  constructor(message: string) {
    super("HANDLER_ERROR", message);
    this.name = "HandlerError";
  }
}
