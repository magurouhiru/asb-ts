import { flatten, type GenericSchema, type SafeParseResult } from "valibot";
import type { ASBError, ErrorType, OutputPackFailure } from "./types/index.js";

function pushASBError(
  errors: ASBError[],
  obj: Record<string, string[] | undefined>,
) {
  Object.entries(obj).forEach(([k, v]) => {
    if (v) {
      v.forEach((message) => {
        errors.push({ path: k, message });
      });
    }
  });
}

export function toOutputPackFailure(
  errorType: ErrorType,
  issues: Extract<SafeParseResult<GenericSchema>, { success: false }>["issues"],
): OutputPackFailure {
  const errors: ASBError[] = [];
  const f = flatten(issues);

  const root = f.root;
  if (root) {
    pushASBError(errors, { root });
  }

  const nested = f.nested;
  if (nested) {
    pushASBError(errors, nested);
  }

  const other = f.other;
  if (other) {
    pushASBError(errors, { other });
  }

  return {
    status: "failure",
    errorType,
    errors,
  };
}
