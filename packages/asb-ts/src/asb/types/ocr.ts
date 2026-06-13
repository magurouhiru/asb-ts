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
  meta: OcrMeta;
};

export interface Output_Browser extends ReadOutputCommon {
  imgPacks: ImgPacks_Browser;
}

export type ImgPacks_Browser = Record<OcrLabel, ImgPack_Browser>;
export const IMG_PACK_LABELS = ["original", "grayscale", "binary"] as const;
export type ImgPackLabel = (typeof IMG_PACK_LABELS)[number];
export type ImgPack_Browser = Record<ImgPackLabel, HTMLCanvasElement>;

export type OcrTexts = Record<OcrLabel, OcrText>;
export type OcrText = Record<ImgPackLabel, string>;

export const NORMALIZED_TEXTS_LABELS = ["name"] as const;
export type NormalizedTextsLabel = (typeof NORMALIZED_TEXTS_LABELS)[number];

export type NormalizedTexts = {
  name: string;
};

export type OcrMeta = Record<NormalizedTextsLabel, OcrMetaDetail>;

export interface OcrMetaDetail extends Normalize, ReasonForChoice {}

export interface Normalize {
  removeSpaces?: boolean;
}

export interface ReasonForChoice {
  reasonForChoice?: "same_text_3" | "same_text_2" | "fallback_original";
}
