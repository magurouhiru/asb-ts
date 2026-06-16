import * as v from "valibot";
import type {
  LogDetail,
  OcrExtractedTextRecord,
  OcrNormalizedTextRecord,
} from "../types/index.js";
import {
  PreProcessSchema,
  preRemoveSpace,
  SelectProcessSchema,
  selectFallback,
  selectIfSameString,
  ToNormalizeInputSchema,
  ToSelectInputSchema,
  ToStringSchema,
} from "./normalize.core.js";

export function normalizeName(
  texts: OcrExtractedTextRecord["name"],
  log: LogDetail[],
): { normalizedText: OcrNormalizedTextRecord["name"]; log: LogDetail[] } {
  const result = v.safeParse(
    v.pipe(
      PreProcessSchema(preRemoveSpace, log),
      ToSelectInputSchema,
      SelectProcessSchema(selectIfSameString, log),
      SelectProcessSchema(selectFallback, log),
      ToNormalizeInputSchema,
      ToStringSchema,
    ),
    { texts },
  );
  if (result.success) {
    return { normalizedText: result.output, log };
  } else {
    const flatError = v.flatten(result.issues);
    log.push({
      isValibotError: true,
      action: "valibot safeParse",
      flatError,
    });
    return { normalizedText: null, log };
  }
}
