import * as v from "valibot";
import * as R from "remeda";
import {
  DISPLAY_STAT_NAME_DICT,
  DISPLAY_STAT_NAME_LIST,
  type DisplayStatName,
  IMG_PACK_LABELS,
  type LogDetail,
  type NormalizedTexts,
  type NormalizeInput,
  type NormalizeLog,
  type NormalizeLogRecord,
  type NormalizeProcessLogic,
  NormalizeProcessSchema,
  type NormalizeResultRecord,
  OCR_STAT_NAME_LABELS,
  type OcrExtractedTextRecord,
  type OcrStatNameLabel,
  type OcrStatValueLabel,
  type OcrText,
  type OcrTexts,
  PositiveValueSchema,
  type PreInput,
  type PreProcessLogic,
  PreProcessSchema,
  type SelectInput,
  type SelectProcessLogic,
  SelectProcessSchema,
  type StatNameObj,
  type StatValueObj,
  ToNormalizeInputSchema,
  ToSelectInputSchema,
  ToStringSchema,
  TotalLevelSchema,
  type Type,
} from "../types/index.js";

export function normalizeTexts(ocrTexts: OcrExtractedTextRecord): {
  normalizeResults: NormalizeResultRecord;
  logs: NormalizeLogRecord;
} {
  const name = getNormalizedTextName(ocrTexts.name, []);
  const totalLevel = getNormalizedTextTotalLevel(ocrTexts.level, []);

  const ocr_stat_names = R.fromKeys(OCR_STAT_NAME_LABELS, (label) =>
    getNormalizedTextStatName(ocrTexts[label], []),
  );

  const stats_controller = getStatsController(ocr_stat_names, []);

  const stat_value_obj = Object.fromEntries(
    DISPLAY_STAT_NAME_LIST.map((dsn) => {
      const label = stats_controller.result?.[dsn];
      if (label !== undefined && label !== null) {
        return [dsn, getNormalizedTextStatValue(ocrTexts[label], [])];
      } else {
        return [dsn, { log: [], result: null }];
      }
    }),
  ) as StatValueObj;

  return {
    normalizedTexts: {
      name: name.result,
      totalLevel: totalLevel.result,

      ...R.mapValues(ocr_stat_names, ({result}) => result)

      stats_controller: stats_controller.result,

      health: stat_value_obj.health.result,
      stamina: stat_value_obj.stamina.result,
      oxygen: stat_value_obj.oxygen.result,
      food: stat_value_obj.food.result,

      water: stat_value_obj.water.result,
      temperature: stat_value_obj.temperature.result,
      weight: stat_value_obj.weight.result,
      meleeDamageMultiplier: stat_value_obj.meleeDamageMultiplier.result,

      speedMultiplier: stat_value_obj.speedMultiplier.result,
      temperatureFortitude: stat_value_obj.temperatureFortitude.result,
      craftingSpeedMultiplier: stat_value_obj.craftingSpeedMultiplier.result,
      torpidity: stat_value_obj.torpidity.result,

      imprinting: stat_value_obj.imprinting.result,
    },
    logs: {
      name: name.log,
      totalLevel: totalLevel.log,

      ...R.mapValues(ocr_stat_names, ({log}) => log)

      stats_controller: stats_controller.log,

      health: stat_value_obj.health.log,
      stamina: stat_value_obj.stamina.log,
      oxygen: stat_value_obj.oxygen.log,
      food: stat_value_obj.food.log,

      water: stat_value_obj.water.log,
      temperature: stat_value_obj.temperature.log,
      weight: stat_value_obj.weight.log,
      meleeDamageMultiplier: stat_value_obj.meleeDamageMultiplier.log,

      speedMultiplier: stat_value_obj.speedMultiplier.log,
      temperatureFortitude: stat_value_obj.temperatureFortitude.log,
      craftingSpeedMultiplier: stat_value_obj.craftingSpeedMultiplier.log,
      torpidity: stat_value_obj.torpidity.log,

      imprinting: stat_value_obj.imprinting.log,
    },
  };
}

function getNormalizedTextName(
  ocrText: OcrText,
  log: LogDetail[],
): { log: LogDetail[]; result: NormalizedTexts["name"] } {
  const result = v.safeParse(
    v.pipe(
      PreProcessSchema(preRemoveSpace, log),
      ToSelectInputSchema,
      SelectProcessSchema(selectIfSameString, log),
      SelectProcessSchema(selectFallback, log),
      ToNormalizeInputSchema,
      ToStringSchema,
    ),
    { ocrText },
  );
  if (result.success) {
    return { log, result: result.output };
  } else {
    const flatError = v.flatten(result.issues);
    log.push({
      isValibotError: true,
      action: "valibot safeParse",
      flatError,
    });
    return { log, result: null };
  }
}

function getNormalizedTextTotalLevel(
  ocrText: OcrText,
  log: LogDetail[],
): { log: LogDetail[]; result: NormalizedTexts["totalLevel"] } {
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
    { log, ocrText },
  );
  if (result.success) {
    return { log, result: result.output };
  } else {
    const flatError = v.flatten(result.issues);
    log.push({
      isValibotError: true,
      action: "valibot safeParse",
      flatError,
    });
    return { log, result: null };
  }
}

function getNormalizedTextStatName(
  ocrText: OcrText,
  log: LogDetail[],
): { log: LogDetail[]; result: DisplayStatName | null } {
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
          Object.entries(DISPLAY_STAT_NAME_DICT).find(([, displayNames]) =>
            displayNames.includes(input),
          )?.[0],
      ),
      v.picklist(DISPLAY_STAT_NAME_LIST),
    ),
    { ocrText },
  );
  if (result.success) {
    return { log, result: result.output };
  } else {
    const flatError = v.flatten(result.issues);
    log.push({
      isValibotError: true,
      action: "valibot safeParse",
      flatError,
    });
    return { log, result: null };
  }
}

const statsPositionNameCombination: {
  type: Type;
  hasOxygen: boolean;
  comb: Record<OcrStatNameLabel, DisplayStatName | null>;
}[] = [
  {
    type: "wild",
    hasOxygen: true,
    comb: {
      stat_name_0: "health",
      stat_name_1: "stamina",
      stat_name_2: "oxygen",
      stat_name_3: "food",
      stat_name_4: "weight",

      stat_name_5: "meleeDamageMultiplier",
      stat_name_6: "torpidity",
      stat_name_7: null,
      stat_name_8: null,
      stat_name_9: null,
    },
  },
  {
    type: "wild",
    hasOxygen: false,
    comb: {
      stat_name_0: "health",
      stat_name_1: "stamina",
      stat_name_2: "food",
      stat_name_3: "weight",
      stat_name_4: "meleeDamageMultiplier",

      stat_name_5: "torpidity",
      stat_name_6: null,
      stat_name_7: null,
      stat_name_8: null,
      stat_name_9: null,
    },
  },
  {
    type: "dom",
    hasOxygen: true,
    comb: {
      stat_name_0: null,
      stat_name_1: "health",
      stat_name_2: "stamina",
      stat_name_3: "oxygen",
      stat_name_4: "food",

      stat_name_5: "weight",
      stat_name_6: "meleeDamageMultiplier",
      stat_name_7: "torpidity",
      stat_name_8: null,
      stat_name_9: null,
    },
  },
  {
    type: "dom",
    hasOxygen: false,
    comb: {
      stat_name_0: null,
      stat_name_1: "health",
      stat_name_2: "stamina",
      stat_name_3: "food",
      stat_name_4: "weight",

      stat_name_5: "meleeDamageMultiplier",
      stat_name_6: "torpidity",
      stat_name_7: null,
      stat_name_8: null,
      stat_name_9: null,
    },
  },
  {
    type: "dom",
    hasOxygen: true,
    comb: {
      stat_name_0: null,
      stat_name_1: "health",
      stat_name_2: "stamina",
      stat_name_3: "oxygen",
      stat_name_4: "food",

      stat_name_5: "weight",
      stat_name_6: "meleeDamageMultiplier",
      stat_name_7: "torpidity",
      stat_name_8: "imprinting",
      stat_name_9: null,
    },
  },
  {
    type: "dom",
    hasOxygen: false,
    comb: {
      stat_name_0: null,
      stat_name_1: "health",
      stat_name_2: "stamina",
      stat_name_3: "food",
      stat_name_4: "weight",

      stat_name_5: "meleeDamageMultiplier",
      stat_name_6: "torpidity",
      stat_name_7: "imprinting",
      stat_name_8: null,
      stat_name_9: null,
    },
  },
];

function toValueLabel(label: OcrStatNameLabel): OcrStatValueLabel {
  switch (label) {
    case "stat_name_0":
      return "stat_value_0";
    case "stat_name_1":
      return "stat_value_1";
    case "stat_name_2":
      return "stat_value_2";
    case "stat_name_3":
      return "stat_value_3";
    case "stat_name_4":
      return "stat_value_4";
    case "stat_name_5":
      return "stat_value_5";
    case "stat_name_6":
      return "stat_value_6";
    case "stat_name_7":
      return "stat_value_7";
    case "stat_name_8":
      return "stat_value_8";
    case "stat_name_9":
      return "stat_value_9";
  }
}

function getStatsController(
  stat_name_obj: StatNameObj,
  log: LogDetail[],
): { log: LogDetail[]; result: NormalizedTexts["stats_controller"] } {
  const exactMatch = statsPositionNameCombination.find(({ comb }) =>
    OCR_STAT_NAME_LABELS.every(
      (label) => stat_name_obj[label].result === comb[label],
    ),
  );
  if (exactMatch !== undefined) {
    const result = Object.fromEntries(
      DISPLAY_STAT_NAME_LIST.map((name) => {
        const found = Object.entries(exactMatch.comb).find(
          ([_, v]) => v === name,
        )?.[0];
        if (found !== undefined) {
          return [name, toValueLabel(found as OcrStatNameLabel)];
        } else {
          return [name, null];
        }
      }),
    ) as NormalizedTexts["stats_controller"];
    log.push({
      isValibotError: false,
      action: "testExactMatch",
      input: JSON.stringify(stat_name_obj),
      output: JSON.stringify(result),
    });
    return { log, result };
  }
  log.push({
    isValibotError: false,
    action: "testExactMatch",
    input: JSON.stringify(stat_name_obj),
    output: null,
  });

  const matchOrUnextracted = statsPositionNameCombination.find(({ comb }) =>
    OCR_STAT_NAME_LABELS.every(
      (label) =>
        stat_name_obj[label].result === comb[label] ||
        (stat_name_obj[label].result !== null && comb[label] === null),
    ),
  );
  if (matchOrUnextracted !== undefined) {
    const result = Object.fromEntries(
      DISPLAY_STAT_NAME_LIST.map((name) => {
        const found = Object.entries(matchOrUnextracted.comb).find(
          ([_, v]) => v === name,
        )?.[0];
        if (found !== undefined) {
          return [name, toValueLabel(found as OcrStatNameLabel)];
        } else {
          return [name, null];
        }
      }),
    ) as NormalizedTexts["stats_controller"];
    log.push({
      isValibotError: false,
      action: "testMatchOrUnextracted",
      input: JSON.stringify(stat_name_obj),
      output: JSON.stringify(result),
    });
    return { log, result };
  }
  log.push({
    isValibotError: false,
    action: "testMatchOrUnextracted",
    input: JSON.stringify(stat_name_obj),
    output: null,
  });
  return { log, result: null };
}

function getNormalizedTextStatValue(
  ocrText: OcrText,
  log: LogDetail[],
): { log: LogDetail[]; result: number | null } {
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
    { ocrText },
  );
  if (result.success) {
    return { log, result: result.output };
  } else {
    const flatError = v.flatten(result.issues);
    log.push({
      isValibotError: true,
      action: "valibot safeParse",
      flatError,
    });
    return { log, result: null };
  }
}

const preRemoveSpace: PreProcessLogic = ({
  ocrText: { original, grayscale, binary },
}: PreInput) => ({
  action: "preRemoveSpace",
  output: {
    original: removeStringCore(original, spaceString),
    grayscale: removeStringCore(grayscale, spaceString),
    binary: removeStringCore(binary, spaceString),
  },
  param: spaceString,
});

const preRemoveSplitChar: PreProcessLogic = ({
  ocrText: { original, grayscale, binary },
}: PreInput) => ({
  action: "preRemoveSplittedChar",
  output: {
    original: removeSplitCharCore(original),
    grayscale: removeSplitCharCore(grayscale),
    binary: removeSplitCharCore(binary),
  },
  param: spaceString,
});

function removeSplitCharCore(text: string): string {
  const split = text.split(" ");
  if (split.length === 1) {
    return text;
  } else {
    return split.filter((s) => s.length !== 1).join(" ");
  }
}

const selectIfSameString: SelectProcessLogic = (input: SelectInput) => {
  const { original, grayscale, binary } = input.ocrText;
  let output = null;
  if (original === grayscale && original === binary) {
    output = original;
  } else if (original === grayscale) {
    output = original;
  } else if (grayscale === binary) {
    output = grayscale;
  } else if (binary === original) {
    output = binary;
  } else {
    output = null;
  }

  return { action: "selectIfSameString", output: output };
};

const totalLevelRegExp = /レベル:\d{1,3}/;

const selectTextIfMatchTotalLevelRegExp: SelectProcessLogic = (
  input: SelectInput,
) => ({
  action: "selectTextIfMatchTotalLevelRegExp",
  output: selectTextIfMatchCore(input, totalLevelRegExp),
  param: totalLevelRegExp.source,
});

function selectTextIfMatchCore(
  { ocrText }: SelectInput,
  target: RegExp,
): string | null {
  const matchList = IMG_PACK_LABELS.filter((label) =>
    target.test(ocrText[label]),
  );
  if (matchList.length > 0) {
    if (matchList.includes("original")) {
      return ocrText.original;
    } else if (matchList.includes("grayscale")) {
      return ocrText.grayscale;
    } else {
      return ocrText.binary;
    }
  } else {
    return null;
  }
}

// 主に刷り込み中向けの処理(り込み中見たくなる)
// ターゲットの半分以上の数の文字を検出している　かつ
// 検出した文字がすべて正しい時だけOK
const selectTextIfPpartialMatchStatName: SelectProcessLogic = (
  input: SelectInput,
) => {
  const found = IMG_PACK_LABELS.map((label) =>
    displayStatNameList
      .filter((name) => name.length > 2)
      .find((name) => {
        const text = input.ocrText[label];
        if (name.length / 2 < text.length && text.length <= name.length) {
          if (Array.from(text).every((c) => name.includes(c))) {
            return true;
          }
        }
        return false;
      }),
  ).filter((v) => v !== undefined)[0];

  return {
    action: "selectTextIfPpartialMatchStatName",
    output: found !== undefined ? found : null,
  };
};

const selectTextIfExactMatchStatName: SelectProcessLogic = (
  input: SelectInput,
) => {
  const found = IMG_PACK_LABELS.map((label) =>
    displayStatNameList.find((name) => input.ocrText[label] === name),
  ).filter((v) => v !== undefined)[0];
  return {
    action: "selectTextIfExactMatchStatName",
    output: found !== undefined ? found : null,
    param: JSON.stringify(displayStatNameList),
  };
};

const selectFallback: SelectProcessLogic = (input: SelectInput) => ({
  action: "selectFallback",
  output: input.ocrText.original,
});

const selectIfExistSlashBetweenDots: SelectProcessLogic = ({
  ocrText,
}: SelectInput) => {
  const extracted = IMG_PACK_LABELS.filter((label) =>
    isExistSlashBetweenDots(ocrText[label]),
  );
  let output = null;
  if (extracted.includes("original")) {
    output = ocrText.original;
  } else if (extracted.includes("grayscale")) {
    output = ocrText.grayscale;
  } else {
    output = ocrText.binary;
  }

  return { action: "selectIfExistSlashBetweenDots", output: output };
};

const slashRegExp = /\//g;
const dotRegExp = /\./g;
function isExistSlashBetweenDots(text: string): boolean {
  const slash = [...text.matchAll(slashRegExp)].map((v) => v.index);
  const dot = [...text.matchAll(dotRegExp)].map((v) => v.index);
  return (
    slash.length === 1 && dot.length === 2 && (dot[0] ?? -10) + 2 === slash[0]
  );
}

const normalizeRemoveLevel: NormalizeProcessLogic = (
  input: NormalizeInput,
) => ({
  action: "normalizeRemoveLevel",
  output: removeStringCore(input.normalizedText, levelWhiteListString),
  param: levelWhiteListString,
});

const spaceString = " 　";
function removeStringCore(input: string, param: string): string {
  return Array.from(param).reduce((acc, v) => acc.replaceAll(v, ""), input);
}

const normalizeSplitIfExistSlashBetweenDots: NormalizeProcessLogic = ({
  normalizedText,
}: NormalizeInput) => {
  let output = normalizedText;
  if (isExistSlashBetweenDots(normalizedText)) {
    const splitted = normalizedText.split("/")[1];
    if (splitted) output = splitted;
  }
  return {
    action: "normalizeSplitIfExistSlashBetweenDots",
    output,
  };
};
