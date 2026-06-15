import * as v from "valibot";
import {
  DISPLAY_STAT_NAME_LABELS,
  type LogDetail,
  type NormalizeResultRecord,
  type OcrExtractedTextRecord,
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
  normalizedText: NormalizeResultRecord[OcrStatNameLabel];
  log: LogDetail[];
} {
  const result = v.safeParse(
    v.pipe(
      PreProcessSchema(preRemoveSpace, log),
      ToSelectInputSchema,
      SelectProcessSchema(selectTextIfPpartialMatchStatName, log),
      SelectProcessSchema(selectTextIfExactMatchStatName, log),
      ToNormalizeInputSchema,
      ToStringSchema,
      v.transform(
        (input) =>
          Object.entries(DISPLAY_STAT_NAME_LABELS).find(([, displayNames]) =>
            displayNames.includes(input),
          )?.[0],
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
