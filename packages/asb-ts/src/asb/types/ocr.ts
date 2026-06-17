import type * as v from "valibot";
import type { Imprinting, TotalLevel } from "./calculator.js";
import { type StatsName, StatsNames } from "./stats-name.js";

/////////////////////////////////////////////////////////

export const OCR_COMMON_LABELS = ["name", "level"] as const;
export type OcrCommonLabel = (typeof OCR_COMMON_LABELS)[number];

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

export const OCR_LABELS = [
  ...OCR_COMMON_LABELS,
  ...OCR_STAT_NAME_LABELS,
  ...OCR_STAT_VALUE_LABELS,
] as const;
export type OcrLabel = (typeof OCR_LABELS)[number];

export const IMAGE_LABELS = ["original", "grayscale", "binary"] as const;
export type ImageLabel = (typeof IMAGE_LABELS)[number];

export type OcrRecord<T> = Record<OcrLabel, T>;
export type ImageRecord<T> = Record<ImageLabel, T>;

export const DISPLAY_STAT_NAME_LABELS = [...StatsNames, "imprinting"] as const;
export type DisplayStatNameLabel = (typeof DISPLAY_STAT_NAME_LABELS)[number];

export const DISPLAY_STAT_NAME_RECORD: Record<DisplayStatNameLabel, string[]> =
  {
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

/////////////////////////////////////////////////////////

export const DEFAULT_THRESHOLD = 128;

export const Status = ["Not initialized", "Suspended", "Running"] as const;
export type OcrQueueManagerStatus = (typeof Status)[number];

/////////////////////////////////////////////////////////

export const DEFAULT_CROP_RECT_OPTION = {
  ymNL: 0.17,
  dlmNL: 0.06,
  drmNL: 0.1,
  dhmNL: 0.024,
  ymS: 0.415,
  dlmS: 0.15,
  drmS: 0.18,
  dhmS: 0.0321,
};

export type OcrCropRectRecord = OcrRecord<CropRect>;

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/////////////////////////////////////////////////////////

export type OcrCroppedImageRecord = OcrRecord<CroppedImageRecord>;
export type CroppedImageRecord = ImageRecord<HTMLCanvasElement>;

/////////////////////////////////////////////////////////

export const WHITE_LIST = {
  level: "レベル:",
  number: "0123456789",
  statValue: "./%",
} as const;

export type OcrExtractedPromiseTextRecord =
  OcrRecord<ExtractedPromiseTextRecord>;
export type ExtractedPromiseTextRecord = ImageRecord<Promise<string>>;

export type OcrExtractedTextRecord = OcrRecord<ExtractedTextRecord>;
export type ExtractedTextRecord = ImageRecord<string>;

/////////////////////////////////////////////////////////

export const NORMALIZE_TYPE_LABELS = [
  ...OCR_COMMON_LABELS,
  "stat_name",
  ...DISPLAY_STAT_NAME_LABELS,
] as const;
export type NormalizeTypeLabel = (typeof NORMALIZE_TYPE_LABELS)[number];

export type NormalizeType<T extends NormalizeTypeLabel> = T extends "name"
  ? string
  : T extends "level"
    ? TotalLevel
    : T extends "stat_name"
      ? DisplayStatNameLabel
      : T extends StatsName
        ? number
        : Imprinting;

export type NormalizeResult<T extends NormalizeTypeLabel> = {
  type: T;
  text: NormalizeType<T> | null;
};

export type OcrNormalizedTextRecord = {
  [K in OcrLabel]: K extends "name"
    ? NormalizeResult<"name">
    : K extends "level"
      ? NormalizeResult<"level">
      : K extends OcrStatNameLabel
        ? NormalizeResult<"stat_name">
        : NormalizeResult<DisplayStatNameLabel>;
};

export type OcrNormalizeLogRecord = OcrRecord<LogDetail[]>;

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
