import * as R from "remeda";
import * as v from "valibot";
import {
  DISPLAY_STAT_NAME_LABELS,
  DISPLAY_STAT_NAME_RECORD,
  type LogDetail,
  type OcrExtractedTextRecord,
  type OcrNormalizedTextRecord,
  type OcrStatNameLabel,
} from "../types/index.js";
import {
  PreProcessSchema,
  preRemoveSpace,
  SelectProcessSchema,
  selectTextIfExactMatchStatName,
  selectTextIfPpartialMatchStatName,
  ToNormalizeInputSchema,
  ToSelectInputSchema,
  ToStringSchema,
} from "./normalize.core.js";

export function normalizeStatName(
  texts: OcrExtractedTextRecord[OcrStatNameLabel],
  log: LogDetail[],
): {
  normalizedText: OcrNormalizedTextRecord[OcrStatNameLabel];
  log: LogDetail[];
} {
  const result = v.safeParse(
    v.pipe(
      PreProcessSchema(preRemoveSpace, log),
      ToSelectInputSchema,
      SelectProcessSchema(selectTextIfExactMatchStatName, log),
      SelectProcessSchema(selectTextIfPpartialMatchStatName, log),
      ToNormalizeInputSchema,
      ToStringSchema,
      v.transform(
        (input) =>
          R.pipe(
            DISPLAY_STAT_NAME_RECORD,
            R.entries(),
            R.filter(([_, names]) => names.some((name) => name === input)),
          )[0]?.[0],
      ),
      v.picklist(DISPLAY_STAT_NAME_LABELS),
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
