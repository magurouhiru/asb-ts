import * as v from "valibot";
import {
  type LogDetail,
  type NormalizeResultRecord,
  type OcrExtractedTextRecord,
  TotalLevelSchema,
} from "../types/index.js";
import {
  NormalizeProcessSchema,
  normalizeRemoveLevel,
  PreProcessSchema,
  preRemoveSpace,
  SelectProcessSchema,
  selectTextIfMatchTotalLevelRegExp,
  ToNormalizeInputSchema,
  ToSelectInputSchema,
  ToStringSchema,
} from "./normalize.core.js";

export function normalizeTotalLevel(
  texts: OcrExtractedTextRecord["level"],
  log: LogDetail[],
): { normalizedText: NormalizeResultRecord["totalLevel"]; log: LogDetail[] } {
  const result = v.safeParse(
    v.pipe(
      PreProcessSchema(preRemoveSpace, log),
      ToSelectInputSchema,
      SelectProcessSchema(selectTextIfMatchTotalLevelRegExp, log),
      ToNormalizeInputSchema,
      NormalizeProcessSchema(normalizeRemoveLevel, log),
      ToStringSchema,
      v.nonEmpty(),
      v.toNumber(),
      TotalLevelSchema,
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
