import * as R from "remeda";
import * as v from "valibot";
import {
  DISPLAY_STAT_NAME_LABELS,
  DISPLAY_STAT_NAME_RECORD,
  type LogDetail,
  type NormalizeResult,
  type NormalizeType,
  type NormalizeTypeLabel,
  OCR_LABELS,
  OCR_STAT_NAME_LABELS,
  OCR_STAT_VALUE_LABELS,
  type OcrExtractedTextRecord,
  type OcrLabel,
  type OcrNormalizedTextRecord,
  type OcrNormalizeLogRecord,
  PositiveValueSchema,
  TotalLevelSchema,
} from "../types/index.js";
import * as c from "./normalize.core.js";

export function normalizeTexts(ocrTexts: OcrExtractedTextRecord): {
  normalizedTexts: OcrNormalizedTextRecord;
  logs: OcrNormalizeLogRecord;
} {
  const logs: OcrNormalizeLogRecord = R.fromKeys(OCR_LABELS, () => []);

  const name = normalizeText(
    ocrTexts.name,
    logs.name,
    "name",
    v.pipe(
      c.PreProcessSchema(c.preRemoveSpace, logs.name),
      c.ToSelectInputSchema,
      c.SelectProcessSchema(c.selectIfSameString, logs.name),
      c.SelectProcessSchema(c.selectFallback, logs.name),
      c.ToNormalizeInputSchema,
      c.ToStringSchema,
    ),
  );

  const level = normalizeText(
    ocrTexts.level,
    logs.level,
    "level",
    v.pipe(
      c.PreProcessSchema(c.preRemoveSpace, logs.level),
      c.ToSelectInputSchema,
      c.SelectProcessSchema(c.selectTextIfMatchTotalLevelRegExp, logs.level),
      c.ToNormalizeInputSchema,
      c.NormalizeProcessSchema(c.normalizeRemoveLevel, logs.level),
      c.ToStringSchema,
      v.nonEmpty(),
      v.toNumber(),
      TotalLevelSchema,
    ),
  );

  const ocrStatNames = R.fromKeys(OCR_STAT_NAME_LABELS, (label) =>
    normalizeText(
      ocrTexts[label],
      logs[label],
      "stat_name",
      v.pipe(
        c.PreProcessSchema(c.preRemoveSpace, logs[label]),
        c.ToSelectInputSchema,
        c.SelectProcessSchema(c.selectTextIfExactMatchStatName, logs[label]),
        c.SelectProcessSchema(c.selectTextIfPpartialMatchStatName, logs[label]),
        c.ToNormalizeInputSchema,
        c.ToStringSchema,
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
    ),
  );

  const ocrStatValues = R.fromKeys(OCR_STAT_VALUE_LABELS, (label) =>
    normalizeText(
      ocrTexts[label],
      logs[label],
      "health",
      v.pipe(
        c.PreProcessSchema(c.preRemoveSplitChar, logs[label]),
        c.PreProcessSchema(c.preRemoveSpace, logs[label]),
        c.ToSelectInputSchema,
        c.SelectProcessSchema(c.selectIfExistSlashBetweenDots, logs[label]),
        c.SelectProcessSchema(c.selectIfSameString, logs[label]),
        c.SelectProcessSchema(c.selectFallback, logs[label]),
        c.ToNormalizeInputSchema,
        c.NormalizeProcessSchema(
          c.normalizeSplitIfExistSlashBetweenDots,
          logs[label],
        ),
        c.ToStringSchema,
        v.toNumber(),
        PositiveValueSchema,
      ),
    ),
  );

  return {
    normalizedTexts: {
      name,
      level,

      ...ocrStatNames,
      ...ocrStatValues,
    },
    logs,
  };
}

function normalizeText<T extends NormalizeTypeLabel>(
  texts: OcrExtractedTextRecord[OcrLabel],
  log: LogDetail[],
  type: T,
  schema: v.GenericSchema<unknown, NormalizeType<T>, v.GenericIssue>,
): NormalizeResult<T> {
  const result = v.safeParse<typeof schema>(schema, { texts });
  if (result.success) {
    return { type, text: result.output };
  } else {
    const flatError = v.flatten(result.issues);
    log.push({
      isValibotError: true,
      action: "valibot safeParse",
      flatError,
    });
    return { type, text: null };
  }
}
