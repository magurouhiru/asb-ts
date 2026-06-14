import * as v from "valibot";
import type { TotalLevel } from "./calculator.js";
import { StatsNames } from "./stats-name.js";

export const DISPLAY_STAT_NAME_LIST = [...StatsNames, "imprinting"] as const;
export type DisplayStatName = (typeof DISPLAY_STAT_NAME_LIST)[number];

export const DISPLAY_STAT_NAME_DICT: Record<DisplayStatName, string[]> = {
  health: ["体力"],
  stamina: ["スタミナ"],
  oxygen: ["酸素量"],
  food: ["食料"],

  water: [],
  temperature: [],
  weight: ["重量"],
  meleeDamageMultiplier: ["近接攻撃力"],

  speedMultiplier: [],
  temperatureFortitude: [],
  craftingSpeedMultiplier: [],
  torpidity: ["気絶値"],
  imprinting: ["刷り込み中"],
} as const;

export const DEFAULT_REGIONS_OPTION = {
  ymNL: 0.17,
  dlmNL: 0.06,
  drmNL: 0.1,
  dhmNL: 0.024,
  ymS: 0.415,
  dlmS: 0.15,
  drmS: 0.18,
  dhmS: 0.0321,
};

export const DEFAULT_THRESHOLD = 128;

export const OCR_STAT_NAME_LABELS = [
  "stat_name_0",
  "stat_name_1",
  "stat_name_2",
  "stat_name_3",
  "stat_name_4",
  "stat_name_5",
  "stat_name_6",
  "stat_name_7",
  "stat_name_8",
  "stat_name_9",
] as const;
export type OcrStatNameLabel = (typeof OCR_STAT_NAME_LABELS)[number];

export const OCR_STAT_VALUE_LABELS = [
  "stat_value_0",
  "stat_value_1",
  "stat_value_2",
  "stat_value_3",
  "stat_value_4",
  "stat_value_5",
  "stat_value_6",
  "stat_value_7",
  "stat_value_8",
  "stat_value_9",
] as const;
export type OcrStatValueLabel = (typeof OCR_STAT_VALUE_LABELS)[number];

export const OCR_COMMON_LABELS = ["name", "level"] as const;
export type OcrCommonLabel = (typeof OCR_COMMON_LABELS)[number];

export const OCR_LABELS = [
  ...OCR_COMMON_LABELS,
  ...OCR_STAT_NAME_LABELS,
  ...OCR_STAT_VALUE_LABELS,
] as const;
export type OcrLabel = (typeof OCR_LABELS)[number];

export type Regions = Record<OcrLabel, Region>;

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ReadOutput = Output_Browser;

export type ReadOutputCommon = {
  regions: Regions;
  ocrTexts: OcrTexts;
  normalizedTexts: NormalizedTexts;
  logs: NormalizeLog;
};

export type NormalizeLog = Record<NormalizedTextsLabel, LogDetail[]>;

export interface Output_Browser extends ReadOutputCommon {
  imgPacks: ImgPacks_Browser;
}

export type ImgPacks_Browser = Record<OcrLabel, ImgPack_Browser>;
export const IMG_PACK_LABELS = ["original", "grayscale", "binary"] as const;
export type ImgPackLabel = (typeof IMG_PACK_LABELS)[number];
export type ImgPack_Browser = Record<ImgPackLabel, HTMLCanvasElement>;

export type OcrTexts = Record<OcrLabel, OcrText>;
export type OcrText = Record<ImgPackLabel, string>;

export const NORMALIZED_TEXTS_LABELS = [
  "name",
  "totalLevel",
  ...OCR_STAT_NAME_LABELS,
] as const;
export type NormalizedTextsLabel = (typeof NORMALIZED_TEXTS_LABELS)[number];

export type NormalizedTexts = {
  name: string | null;
  totalLevel: TotalLevel | null;

  stat_name_0: DisplayStatName | null;
  stat_name_1: DisplayStatName | null;
  stat_name_2: DisplayStatName | null;
  stat_name_3: DisplayStatName | null;
  stat_name_4: DisplayStatName | null;

  stat_name_5: DisplayStatName | null;
  stat_name_6: DisplayStatName | null;
  stat_name_7: DisplayStatName | null;
  stat_name_8: DisplayStatName | null;
  stat_name_9: DisplayStatName | null;
};

export type LogDetail =
  | {
      isValibotError: true;
      action: "valibot safeParse";
      flatError: v.FlatErrors<v.GenericSchema>;
    }
  | {
      isValibotError: false;
      action: string;
      input: string;
      output: string | null;
      param?: string;
    };

export const OcrTextSchema = v.object(
  v.entriesFromList(IMG_PACK_LABELS, v.string()),
);

export const PreInputSchema = v.object({
  ocrText: OcrTextSchema,
});
export type PreInput = v.InferOutput<typeof PreInputSchema>;

export const SelectInputSchema = v.object({
  ocrText: OcrTextSchema,
  selectedText: v.nullable(v.string()),
});
export type SelectInput = v.InferOutput<typeof SelectInputSchema>;

export const NormalizeInputSchema = v.object({
  ocrText: OcrTextSchema,
  selectedText: v.string(),
  normalizedText: v.string(),
});
export type NormalizeInput = v.InferOutput<typeof NormalizeInputSchema>;

export type PreProcessLogic = (input: PreInput) => {
  action: string;
  output: OcrText;
  param?: string;
};

export const PreProcessSchema = (logic: PreProcessLogic, log: LogDetail[]) =>
  v.pipe(
    PreInputSchema,
    v.transform((input: PreInput) => {
      const result = logic(input);
      log.push({
        ...result,
        isValibotError: false,
        input: JSON.stringify(input.ocrText),
        output: JSON.stringify(result.output),
      });
      return { ...input, ocrText: result.output };
    }),
  );

export type SelectProcessLogic = (input: SelectInput) => {
  action: string;
  output: string | null;
  param?: string;
};

export const SelectProcessSchema = (
  logic: SelectProcessLogic,
  log: LogDetail[],
) =>
  v.pipe(
    SelectInputSchema,
    v.transform((input: SelectInput) => {
      const result = logic(input);
      log.push({
        ...result,
        isValibotError: false,
        input: JSON.stringify(input.ocrText),
        output: result.output,
      });
      if (result.output !== null) {
        return { ...input, selectedText: result.output };
      } else {
        return input;
      }
    }),
  );

export type NormalizeProcessLogic = (input: NormalizeInput) => {
  action: string;
  output: string;
  param?: string;
};

export const NormalizeProcessSchema = (
  logic: NormalizeProcessLogic,
  log: LogDetail[],
) =>
  v.pipe(
    NormalizeInputSchema,
    v.transform((input: NormalizeInput) => {
      const result = logic(input);
      log.push({
        ...result,
        isValibotError: false,
        input: input.normalizedText,
        output: result.output,
      });
      return { ...input, normalizedText: result.output };
    }),
  );

export const ToSelectInputSchema = v.pipe(
  PreInputSchema,
  v.transform((input) => ({ ...input, selectedText: null })),
  SelectInputSchema,
);

export const ToNormalizeInputSchema = v.pipe(
  SelectInputSchema,
  v.transform((input) => ({
    ...input,
    normalizedText: input.selectedText,
  })),
  NormalizeInputSchema,
);

export const ToStringSchema = v.pipe(
  NormalizeInputSchema,
  v.transform((input) => input.normalizedText),
  v.string(),
);
