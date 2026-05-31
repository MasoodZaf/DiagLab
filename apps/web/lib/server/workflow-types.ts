/**
 * Shared workflow result/error types. A mutation result carries a locale-agnostic
 * StatusMessage (dictionary key + params) so the client renders it in the active
 * locale; guardrail failures throw WorkflowError carrying the same kind of code.
 */
import type { TenantSnapshot } from "@lab/contracts";

export type StatusMessage = {
  code: string;
  params?: Record<string, string | number>;
};

export type MutationResult = {
  message: StatusMessage;
  snapshot: TenantSnapshot;
};

/** Thrown for guardrail / validation failures, carrying a translatable code. */
export class WorkflowError extends Error {
  code: string;
  params?: Record<string, string | number>;
  constructor(code: string, params?: Record<string, string | number>) {
    super(code);
    this.name = "WorkflowError";
    this.code = code;
    this.params = params;
  }
}

/** Convert any thrown error into a translatable StatusMessage for the API response. */
export function statusFromError(error: unknown): StatusMessage {
  if (error instanceof WorkflowError) {
    return { code: error.code, params: error.params };
  }
  return { code: "status.unknownError" };
}
