import * as R from "remeda";
import {
  type NormalizeLogRecord,
  type NormalizeResultRecord,
  OCR_STAT_NAME_LABELS,
  type OcrExtractedTextRecord,
} from "../types/index.js";
import { normalizeName } from "./normalize.name.js";
import { normalizeStatName } from "./normalize.stat-name.js";
import { normalizeTotalLevel } from "./normalize.total-level.js";

export function normalizeTexts(ocrTexts: OcrExtractedTextRecord): {
  normalizedTexts: NormalizeResultRecord;
  logs: NormalizeLogRecord;
} {
  const name = normalizeName(ocrTexts.name, []);
  const totalLevel = normalizeTotalLevel(ocrTexts.level, []);

  const ocr_stat_names = R.fromKeys(OCR_STAT_NAME_LABELS, (label) =>
    normalizeStatName(ocrTexts[label], []),
  );

  // const stats_controller = getStatsController(ocr_stat_names, []);

  // const stat_value_obj = Object.fromEntries(
  //   DISPLAY_STAT_NAME_LIST.map((dsn) => {
  //     const label = stats_controller.result?.[dsn];
  //     if (label !== undefined && label !== null) {
  //       return [dsn, getNormalizedTextStatValue(ocrTexts[label], [])];
  //     } else {
  //       return [dsn, { log: [], result: null }];
  //     }
  //   }),
  // ) as StatValueObj;

  return {
    normalizedTexts: {
      name: name.normalizedText,
      totalLevel: totalLevel.normalizedText,

      ...R.mapValues(ocr_stat_names, ({ normalizedText }) => normalizedText),
    },
    logs: {
      name: name.log,
      totalLevel: totalLevel.log,

      ...R.mapValues(ocr_stat_names, ({ log }) => log),
    },
  };
}

// const statsPositionNameCombination: {
//   type: Type;
//   hasOxygen: boolean;
//   comb: Record<OcrStatNameLabel, DisplayStatName | null>;
// }[] = [
//   {
//     type: "wild",
//     hasOxygen: true,
//     comb: {
//       stat_name_0: "health",
//       stat_name_1: "stamina",
//       stat_name_2: "oxygen",
//       stat_name_3: "food",
//       stat_name_4: "weight",

//       stat_name_5: "meleeDamageMultiplier",
//       stat_name_6: "torpidity",
//       stat_name_7: null,
//       stat_name_8: null,
//       stat_name_9: null,
//     },
//   },
//   {
//     type: "wild",
//     hasOxygen: false,
//     comb: {
//       stat_name_0: "health",
//       stat_name_1: "stamina",
//       stat_name_2: "food",
//       stat_name_3: "weight",
//       stat_name_4: "meleeDamageMultiplier",

//       stat_name_5: "torpidity",
//       stat_name_6: null,
//       stat_name_7: null,
//       stat_name_8: null,
//       stat_name_9: null,
//     },
//   },
//   {
//     type: "dom",
//     hasOxygen: true,
//     comb: {
//       stat_name_0: null,
//       stat_name_1: "health",
//       stat_name_2: "stamina",
//       stat_name_3: "oxygen",
//       stat_name_4: "food",

//       stat_name_5: "weight",
//       stat_name_6: "meleeDamageMultiplier",
//       stat_name_7: "torpidity",
//       stat_name_8: null,
//       stat_name_9: null,
//     },
//   },
//   {
//     type: "dom",
//     hasOxygen: false,
//     comb: {
//       stat_name_0: null,
//       stat_name_1: "health",
//       stat_name_2: "stamina",
//       stat_name_3: "food",
//       stat_name_4: "weight",

//       stat_name_5: "meleeDamageMultiplier",
//       stat_name_6: "torpidity",
//       stat_name_7: null,
//       stat_name_8: null,
//       stat_name_9: null,
//     },
//   },
//   {
//     type: "dom",
//     hasOxygen: true,
//     comb: {
//       stat_name_0: null,
//       stat_name_1: "health",
//       stat_name_2: "stamina",
//       stat_name_3: "oxygen",
//       stat_name_4: "food",

//       stat_name_5: "weight",
//       stat_name_6: "meleeDamageMultiplier",
//       stat_name_7: "torpidity",
//       stat_name_8: "imprinting",
//       stat_name_9: null,
//     },
//   },
//   {
//     type: "dom",
//     hasOxygen: false,
//     comb: {
//       stat_name_0: null,
//       stat_name_1: "health",
//       stat_name_2: "stamina",
//       stat_name_3: "food",
//       stat_name_4: "weight",

//       stat_name_5: "meleeDamageMultiplier",
//       stat_name_6: "torpidity",
//       stat_name_7: "imprinting",
//       stat_name_8: null,
//       stat_name_9: null,
//     },
//   },
// ];

// function toValueLabel(label: OcrStatNameLabel): OcrStatValueLabel {
//   switch (label) {
//     case "stat_name_0":
//       return "stat_value_0";
//     case "stat_name_1":
//       return "stat_value_1";
//     case "stat_name_2":
//       return "stat_value_2";
//     case "stat_name_3":
//       return "stat_value_3";
//     case "stat_name_4":
//       return "stat_value_4";
//     case "stat_name_5":
//       return "stat_value_5";
//     case "stat_name_6":
//       return "stat_value_6";
//     case "stat_name_7":
//       return "stat_value_7";
//     case "stat_name_8":
//       return "stat_value_8";
//     case "stat_name_9":
//       return "stat_value_9";
//   }
// }

// function getStatsController(
//   stat_name_obj: StatNameObj,
//   log: LogDetail[],
// ): { log: LogDetail[]; result: NormalizedTexts["stats_controller"] } {
//   const exactMatch = statsPositionNameCombination.find(({ comb }) =>
//     OCR_STAT_NAME_LABELS.every(
//       (label) => stat_name_obj[label].result === comb[label],
//     ),
//   );
//   if (exactMatch !== undefined) {
//     const result = Object.fromEntries(
//       DISPLAY_STAT_NAME_LIST.map((name) => {
//         const found = Object.entries(exactMatch.comb).find(
//           ([_, v]) => v === name,
//         )?.[0];
//         if (found !== undefined) {
//           return [name, toValueLabel(found as OcrStatNameLabel)];
//         } else {
//           return [name, null];
//         }
//       }),
//     ) as NormalizedTexts["stats_controller"];
//     log.push({
//       isValibotError: false,
//       action: "testExactMatch",
//       input: JSON.stringify(stat_name_obj),
//       output: JSON.stringify(result),
//     });
//     return { log, result };
//   }
//   log.push({
//     isValibotError: false,
//     action: "testExactMatch",
//     input: JSON.stringify(stat_name_obj),
//     output: null,
//   });

//   const matchOrUnextracted = statsPositionNameCombination.find(({ comb }) =>
//     OCR_STAT_NAME_LABELS.every(
//       (label) =>
//         stat_name_obj[label].result === comb[label] ||
//         (stat_name_obj[label].result !== null && comb[label] === null),
//     ),
//   );
//   if (matchOrUnextracted !== undefined) {
//     const result = Object.fromEntries(
//       DISPLAY_STAT_NAME_LIST.map((name) => {
//         const found = Object.entries(matchOrUnextracted.comb).find(
//           ([_, v]) => v === name,
//         )?.[0];
//         if (found !== undefined) {
//           return [name, toValueLabel(found as OcrStatNameLabel)];
//         } else {
//           return [name, null];
//         }
//       }),
//     ) as NormalizedTexts["stats_controller"];
//     log.push({
//       isValibotError: false,
//       action: "testMatchOrUnextracted",
//       input: JSON.stringify(stat_name_obj),
//       output: JSON.stringify(result),
//     });
//     return { log, result };
//   }
//   log.push({
//     isValibotError: false,
//     action: "testMatchOrUnextracted",
//     input: JSON.stringify(stat_name_obj),
//     output: null,
//   });
//   return { log, result: null };
// }

// function getNormalizedTextStatValue(
//   ocrText: OcrText,
//   log: LogDetail[],
// ): { log: LogDetail[]; result: number | null } {
//   const result = v.safeParse(
//     v.pipe(
//       PreProcessSchema(preRemoveSplitChar, log),
//       PreProcessSchema(preRemoveSpace, log),
//       ToSelectInputSchema,
//       SelectProcessSchema(selectIfExistSlashBetweenDots, log),
//       SelectProcessSchema(selectIfSameString, log),
//       SelectProcessSchema(selectFallback, log),
//       ToNormalizeInputSchema,
//       NormalizeProcessSchema(normalizeSplitIfExistSlashBetweenDots, log),
//       ToStringSchema,
//       v.toNumber(),
//       PositiveValueSchema,
//     ),
//     { ocrText },
//   );
//   if (result.success) {
//     return { log, result: result.output };
//   } else {
//     const flatError = v.flatten(result.issues);
//     log.push({
//       isValibotError: true,
//       action: "valibot safeParse",
//       flatError,
//     });
//     return { log, result: null };
//   }
// }
