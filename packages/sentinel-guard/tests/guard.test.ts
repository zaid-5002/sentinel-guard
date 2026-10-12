import { describe, it, expect } from "vitest";
import { createGuard } from "../src/index";
import {
  UnknownActionError,
  ApprovalNotFoundError,
  InvalidApprovalStateError,
  InvalidPolicyError,
} from "../src/index";

describe("Sentinel Guard — permission enforcement", () => {
  const setup = () => {
    const guard = createGuard({
      rules: {
        "file:read": "allow",
        "file:delete": "approval-required",
        "secret:access": "deny",
      },
    });

    let deleted = false;
    let readCalled = 0;

    guard.registerAction("file:read", async () => {
      readCalled++;
      return { content: "sample file content" };
    });

    guard.registerAction("file:delete", async () => {
      deleted = true;
      return { deleted: true };
    });

    guard.registerAction("secret:access", async () => {
      return { secret: "sensitive-value" };
    });

    guard.registerAction("failing:action", async () => {
      throw new Error("Something went wrong");
    });

    return { guard, getDeleted: () => deleted, getReadCalled: () => readCalled };
  };

  // 1. Allowed actions execute successfully
  it("allows and executes a permitted action", async () => {
    const { guard, getReadCalled } = setup();
    const result = await guard.execute("file:read", { filename: "test.txt" });
    expect(result.status).toBe("allowed");
    expect(result.decision).toBe("allow");
    expect(result.result).toEqual({ content: "sample file content" });
    expect(getReadCalled()).toBe(1);
  });

  // 2. Denied actions never execute
  it("denies a forbidden action without executing the handler", async () => {
    const { guard } = setup();
    const result = await guard.execute("secret:access");
    expect(result.status).toBe("denied");
    expect(result.decision).toBe("deny");
    expect(result.result).toBeUndefined();
  });

  // 3. Unknown actions are denied
  it("denies unconfigured actions by default", async () => {
    const { guard } = setup();
    const result = await guard.execute("unknown:action");
    expect(result.status).toBe("denied");
    expect(result.decision).toBe("deny");
  });

  // 4. Approval-required actions remain pending
  it("creates a pending approval for approval-required actions", async () => {
    const { guard, getDeleted } = setup();
    const result = await guard.execute("file:delete", { filename: "test.txt" });
    expect(result.status).toBe("approval-required");
    expect(result.approvalId).toBeTruthy();
    expect(getDeleted()).toBe(false);
  });

  // 5. Pending actions do not execute before approval
  it("does not execute the handler before approval", async () => {
    const { guard, getDeleted } = setup();
    await guard.execute("file:delete", { filename: "test.txt" });
    expect(getDeleted()).toBe(false);
    const pending = guard.getPendingApprovals();
    expect(pending).toHaveLength(1);
  });

  // 6. Approved actions execute exactly once
  it("executes an approved action exactly once", async () => {
    const { guard, getDeleted } = setup();
    const result = await guard.execute("file:delete", {
      filename: "test.txt",
    });
    const approvalId = result.approvalId!;
    const approveResult = await guard.approve(approvalId);
    expect(approveResult.status).toBe("approved");
    expect(approveResult.result).toEqual({ deleted: true });
    expect(getDeleted()).toBe(true);
    const stillPending = guard.getPendingApprovals();
    expect(stillPending).toHaveLength(0);
  });

  // 7. Rejected actions never execute
  it("never executes a rejected action", async () => {
    const { guard, getDeleted } = setup();
    const result = await guard.execute("file:delete", {
      filename: "test.txt",
    });
    const rejectResult = guard.reject(result.approvalId!);
    expect(rejectResult.status).toBe("rejected");
    expect(getDeleted()).toBe(false);
  });

  // 8. Duplicate approval attempts do not cause duplicate execution
  it("rejects duplicate approval attempts", async () => {
    const { guard, getDeleted } = setup();
    const result = await guard.execute("file:delete", {
      filename: "test.txt",
    });
    const id = result.approvalId!;
    await guard.approve(id);
    expect(getDeleted()).toBe(true);
    await expect(guard.approve(id)).rejects.toThrow(InvalidApprovalStateError);
    expect(getDeleted()).toBe(true);
  });

  // 9. Invalid approval IDs are handled predictably
  it("throws for invalid approval IDs", async () => {
    const { guard } = setup();
    await expect(guard.approve("nonexistent-id")).rejects.toThrow(
      ApprovalNotFoundError
    );
    expect(() => guard.reject("nonexistent-id")).toThrow(ApprovalNotFoundError);
  });

  // 10. Handler failures are recorded in the audit log
  it("records handler failures in the audit log", async () => {
    const guard = createGuard({
      rules: {
        "failing:action": "allow",
      },
    });
    guard.registerAction("failing:action", async () => {
      throw new Error("Something went wrong");
    });
    const result = await guard.execute("failing:action");
    expect(result.status).toBe("error");
    const log = guard.getAuditLog();
    const lastEntry = log[log.length - 1];
    expect(lastEntry.executionOutcome).toBe("failed");
    expect(lastEntry.errorCode).toBe("HANDLER_ERROR");
  });

  // 11. Audit records contain the required metadata
  it("audit records contain required metadata", async () => {
    const { guard } = setup();
    await guard.execute("file:read", { filename: "test.txt" });
    const log = guard.getAuditLog();
    const entry = log[log.length - 1];
    expect(entry).toHaveProperty("id");
    expect(entry).toHaveProperty("timestamp");
    expect(entry).toHaveProperty("action", "file:read");
    expect(entry).toHaveProperty("decision", "allow");
    expect(entry).toHaveProperty("executionOutcome", "success");
    expect(entry).toHaveProperty("approvalId", null);
    expect(entry).toHaveProperty("approvalStatus", null);
    expect(entry).toHaveProperty("errorCode", null);
  });

  // 12. Sensitive inputs are not included in audit records
  it("does not include input values in audit records", async () => {
    const { guard } = setup();
    await guard.execute("file:read", { filename: "test.txt", password: "secret123" });
    const log = guard.getAuditLog();
    const entry = log[log.length - 1];
    const entryStr = JSON.stringify(entry);
    expect(entryStr).not.toContain("secret123");
    expect(entryStr).not.toContain("password");
    expect(entryStr).not.toContain("test.txt");
  });

  // Additional: invalid policy configuration
  it("rejects invalid policy decisions", () => {
    expect(
      () => createGuard({ rules: { "bad:action": "invalid" as never } })
    ).toThrow(InvalidPolicyError);
  });

  // Additional: rejecting an already-rejected request
  it("cannot reject an already-rejected request", async () => {
    const { guard } = setup();
    const result = await guard.execute("file:delete", { filename: "test.txt" });
    const id = result.approvalId!;
    guard.reject(id);
    expect(() => guard.reject(id)).toThrow(InvalidApprovalStateError);
  });

  // Additional: cannot approve an already-rejected request
  it("cannot approve an already-rejected request", async () => {
    const { guard } = setup();
    const result = await guard.execute("file:delete", { filename: "test.txt" });
    const id = result.approvalId!;
    guard.reject(id);
    await expect(guard.approve(id)).rejects.toThrow(InvalidApprovalStateError);
  });

  // Additional: approve then reject is blocked
  it("cannot reject an already-approved request", async () => {
    const { guard } = setup();
    const result = await guard.execute("file:delete", { filename: "test.txt" });
    const id = result.approvalId!;
    await guard.approve(id);
    expect(() => guard.reject(id)).toThrow(InvalidApprovalStateError);
  });

  // Additional: execution throws for unregistered allowed actions
  it("throws UnknownActionError for unregistered allowed actions", async () => {
    const guard = createGuard({ rules: { "unregistered:action": "allow" } });
    await expect(guard.execute("unregistered:action")).rejects.toThrow(
      UnknownActionError
    );
  });
});
