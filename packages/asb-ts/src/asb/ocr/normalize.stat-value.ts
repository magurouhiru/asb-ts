import * as v from "valibot";
import {
  type LogDetail,
  type OcrExtractedTextRecord,
  type OcrNormalizedTextRecord,
  type OcrStatValueLabel,
  PositiveValueSchema,
} from "../types/index.js";
import {
  NormalizeProcessSchema,
  normalizeSplitIfExistSlashBetweenDots,
  PreProcessSchema,
  preRemoveSpace,
  preRemoveSplitChar,
  SelectProcessSchema,
  selectFallback,
  selectIfExistSlashBetweenDots,
  selectIfSameString,
  ToNormalizeInputSchema,
  ToSelectInputSchema,
  ToStringSchema,
} from "./normalize.core.js";

export function normalizeStatValue(
  texts: OcrExtractedTextRecord[OcrStatValueLabel],
  log: LogDetail[],
): {
  normalizedText: OcrNormalizedTextRecord[OcrStatValueLabel];
  log: LogDetail[];
} {
  const result = v.safeParse(
    v.pipe(
      PreProcessSchema(preRemoveSplitChar, log),
      PreProcessSchema(preRemoveSpace, log),
      ToSelectInputSchema,
      SelectProcessSchema(selectIfExistSlashBetweenDots, log),
      SelectProcessSchema(selectIfSameString, log),
      SelectProcessSchema(selectFallback, log),
      ToNormalizeInputSchema,
      NormalizeProcessSchema(normalizeSplitIfExistSlashBetweenDots, log),
      ToStringSchema,
      v.toNumber(),
      PositiveValueSchema,
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
