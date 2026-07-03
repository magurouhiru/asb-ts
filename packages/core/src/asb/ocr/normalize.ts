import * as R from "remeda";
import * as v from "valibot";
import {
  ASBTSErrorCommon,
  DISPLAY_STAT_NAME_LABELS,
  type ExtractType,
  ImprintingSchema,
  type ImprintingUnsafe,
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
  type OcrStatNameLabel,
  type OcrStatValueLabel,
  PositiveNumberSchema,
  STAT_LABELS,
  STATS_POSITION_NAME_COMBINATIONS,
  type StatsPositionCombinationValue,
  type StatsType,
  type StatValuesUnsafe,
  TotalLevelSchema,
  type TotalLevelUnsafe,
  WILD_IMP,
} from "../types/index.js";
import * as c from "./normalize.core.js";

export function normalizeTexts(ocrTexts: OcrExtractedTextRecord): {
  normalizedTexts: OcrNormalizedTextRecord;
  withDom: NormalizeResult<"withDom">;
  withDomLog: LogDetail[];
  ip: {
    name: string;
    type: StatsType;
    values: StatValuesUnsafe;
    withDom: boolean;
    totalLevel: TotalLevelUnsafe;
    imprinting: ImprintingUnsafe;
  };
  logs: OcrNormalizeLogRecord;
} {
  const logs: OcrNormalizeLogRecord = R.fromKeys(OCR_LABELS, () => []);

  const name = normalizeText(
    ocrTexts.name,
    logs.name,
    "name",
    "default",
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
    "level",
    v.pipe(
      c.PreProcessSchema(c.preRemoveSplit1, logs.level),
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
      "statName",
      v.pipe(
        c.PreProcessSchema(c.preRemoveSplit1, logs[label]),
        c.PreProcessSchema(c.preRemoveSpace, logs[label]),
        c.PreProcessSchema(c.preRemoveSameChar, logs[label]),
        c.ToSelectInputSchema,
        c.SelectProcessSchema(c.selectTextIfExactMatchStatName, logs[label]),
        c.SelectProcessSchema(c.selectTextIfPpartialMatchStatName, logs[label]),
        c.ToNormalizeInputSchema,
        c.NormalizeProcessSchema(c.normalizeStatName, logs.level),
        c.ToStringSchema,
        v.picklist(DISPLAY_STAT_NAME_LABELS),
      ),
    ),
  );

  const { type, comb } = selectStatsPositionCombinationName(ocrStatNames);

  let imprinting = WILD_IMP;

  const ocrStatValues = R.fromKeys(OCR_STAT_VALUE_LABELS, (label) => {
    const nt = comb[label];
    switch (nt) {
      case null: {
        return normalizeText(
          ocrTexts[label],
          logs[label],
          nt,
          "default",
          v.null(),
        );
      }
      case "imprinting": {
        const tmpImp = normalizeText(
          ocrTexts[label],
          logs[label],
          nt,
          "statValue",
          v.pipe(
            c.PreProcessSchema(c.preRemoveSplit1, logs[label]),
            c.PreProcessSchema(c.preRemoveSpace, logs[label]),
            c.ToSelectInputSchema,
            c.SelectProcessSchema(c.selectIf_nn_dot_n_parcent, logs[label]),
            c.SelectProcessSchema(c.selectIf_nn_parcent, logs[label]),
            c.SelectProcessSchema(c.selectIfSameString, logs[label]),
            c.SelectProcessSchema(c.selectFallback, logs[label]),
            c.ToNormalizeInputSchema,
            c.NormalizeProcessSchema(c.normalizeRemoveParcet, logs[label]),
            c.ToStringSchema,
            v.toNumber(),
            v.transform((input) => input / 100),
            ImprintingSchema,
          ),
        );
        if (tmpImp.value !== null) {
          imprinting = tmpImp.value;
        }
        return tmpImp;
      }
      case "meleeDamageMultiplier": {
        return normalizeText(
          ocrTexts[label],
          logs[label],
          nt,
          "statValue",
          v.pipe(
            c.PreProcessSchema(c.preRemoveSplit1, logs[label]),
            c.PreProcessSchema(c.preRemoveSpace, logs[label]),
            c.ToSelectInputSchema,
            c.SelectProcessSchema(c.selectIf_nn_dot_n_parcent, logs[label]),
            c.SelectProcessSchema(c.selectIf_nn_parcent, logs[label]),
            c.SelectProcessSchema(c.selectIfSameString, logs[label]),
            c.SelectProcessSchema(c.selectFallback, logs[label]),
            c.ToNormalizeInputSchema,
            c.NormalizeProcessSchema(c.normalizeRemoveParcet, logs[label]),
            c.NormalizeProcessSchema(
              c.normalizeAddDotIfNotExistDot,
              logs[label],
            ),
            c.ToStringSchema,
            v.toNumber(),
            v.transform((input) => input / 100),
            PositiveNumberSchema,
          ),
        );
      }
      default: {
        return normalizeText(
          ocrTexts[label],
          logs[label],
          nt,
          "statValue",
          v.pipe(
            c.PreProcessSchema(c.preRemoveSplit1, logs[label]),
            c.PreProcessSchema(c.preRemoveSpace, logs[label]),
            c.ToSelectInputSchema,
            c.SelectProcessSchema(c.selectIfDiffSlash, logs[label]),
            c.SelectProcessSchema(
              c.selectIf_nn_dot_n_slash_nn_dot_n,
              logs[label],
            ),
            c.SelectProcessSchema(c.selectIf_nn_dot_n_7_nn_dot_n, logs[label]),
            c.SelectProcessSchema(c.selectIfSameString, logs[label]),
            c.SelectProcessSchema(c.selectFallback, logs[label]),
            c.ToNormalizeInputSchema,
            c.NormalizeProcessSchema(
              c.normalizeSplitIf_nn_dot_n_slash_nn_dot_n,
              logs[label],
            ),
            c.NormalizeProcessSchema(
              c.normalizeSplitIf_nn_dot_n_7_nn_dot_n,
              logs[label],
            ),
            c.NormalizeProcessSchema(
              c.normalizeSplitIf_nn_dot_n_7_nn,
              logs[label],
            ),
            c.NormalizeProcessSchema(
              c.normalizeAddDotIfNotExistDot,
              logs[label],
            ),
            c.ToStringSchema,
            v.toNumber(),
            PositiveNumberSchema,
          ),
        );
      }
    }
  });

  const withDomLog: LogDetail[] = [];
  const withDom =
    type === "wild"
      ? { type: "withDom" as const, value: null }
      : normalizeText(
          ocrTexts.stat_name_0,
          withDomLog,
          "withDom",
          "statValue",
          v.pipe(
            c.PreProcessSchema(c.preRemoveSplit1, withDomLog),
            c.PreProcessSchema(c.preRemoveSpace, withDomLog),
            c.ToSelectInputSchema,
            c.SelectProcessSchema(c.selectIfDiffSlash, withDomLog),
            c.SelectProcessSchema(
              c.selectIf_nn_dot_n_slash_nn_dot_n,
              withDomLog,
            ),
            c.SelectProcessSchema(c.selectIf_nn_dot_n_7_nn_dot_n, withDomLog),
            c.SelectProcessSchema(c.selectIfSameString, withDomLog),
            c.SelectProcessSchema(c.selectFallback, withDomLog),
            c.ToNormalizeInputSchema,
            c.ToStringSchema,
            v.transform((input) => !/\/10\.0$/.test(input)),
            v.boolean(),
          ),
        );

  const values: StatValuesUnsafe = R.fromKeys(
    STAT_LABELS,
    (sn) =>
      R.pipe(
        ocrStatValues,
        R.entries(),
        R.find(([_, v]) => v.type === sn),
      )?.[1].value ?? undefined,
  );

  return {
    normalizedTexts: {
      name,
      level,

      ...ocrStatNames,
      ...ocrStatValues,
    },
    withDom,
    withDomLog,
    ip: {
      name: name.value ?? "",
      type,
      values,
      withDom: withDom.value ?? false,
      imprinting,
      totalLevel: level.value ?? 0,
    },
    logs,
  };
}

function normalizeText<T extends NormalizeTypeLabel>(
  texts: OcrExtractedTextRecord[OcrLabel],
  log: LogDetail[],
  type: T,
  extractType: ExtractType,
  schema: v.GenericSchema<unknown, NormalizeType<T>, v.GenericIssue>,
): NormalizeResult<T> {
  if (texts[extractType] !== undefined) {
    const result = v.safeParse<typeof schema>(schema, {
      texts: texts[extractType],
    });
    if (result.success) {
      return { type, value: result.output };
    } else {
      const flatError = v.flatten(result.issues);
      log.push({
        isValibotError: true,
        action: "valibot safeParse",
        flatError,
      });
      return { type, value: null };
    }
  } else {
    return { type, value: null };
  }
}

function selectStatsPositionCombinationName(
  ocrStatNames: Pick<OcrNormalizedTextRecord, OcrStatNameLabel>,
): StatsPositionCombinationValue {
  const found = STATS_POSITION_NAME_COMBINATIONS.find(({ comb }) =>
    R.pipe(
      comb,
      R.entries(),
      R.map(
        ([ol, dl]) =>
          ocrStatNames[ol].value === dl || ocrStatNames[ol].value === null,
      ),
      R.reduce((acc, v) => acc && v, true),
    ),
  );
  if (!found) {
    throw new ASBTSErrorCommon(
      "一致するステータスのタイプがありません。",
      "selectStatsPositionCombinationName",
      { ocrStatNames },
    );
  }
  return {
    type: found.type,
    hasOxygen: found.hasOxygen,
    comb: R.fromKeys(
      OCR_STAT_VALUE_LABELS,
      (label) => found.comb[toStatNameLabel(label)],
    ),
  };
}

function toStatNameLabel(label: OcrStatValueLabel): OcrStatNameLabel {
  switch (label) {
    case "stat_value_0":
      return "stat_name_0";
    case "stat_value_1":
      return "stat_name_1";
    case "stat_value_2":
      return "stat_name_2";
    case "stat_value_3":
      return "stat_name_3";
    case "stat_value_4":
      return "stat_name_4";
    case "stat_value_5":
      return "stat_name_5";
    case "stat_value_6":
      return "stat_name_6";
    case "stat_value_7":
      return "stat_name_7";
    case "stat_value_8":
      return "stat_name_8";
    case "stat_value_9":
      return "stat_name_9";
  }
}
