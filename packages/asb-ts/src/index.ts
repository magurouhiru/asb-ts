import * as v from "valibot";
import {
  calculateLevelController,
  calculateValueController,
} from "./asb/calculator.js";
import { cropOcrImages } from "./asb/ocr/crop.browser.js";
import { calcCropRects } from "./asb/ocr/crop-rect.js";
import {
  extractOcrPromiseTexts,
  extractOcrTexts,
} from "./asb/ocr/extract-text.js";
import type { OcrQueueManager } from "./asb/ocr/manager.js";
import { searchSpecies } from "./asb/species.js";
import {
  type CalculateLevelInputPack,
  CalculateLevelInputPackSchema,
  type CalculateLevelOutputPack,
  type CalculateValueInputPack,
  CalculateValueInputPackSchema,
  type CalculateValueOutputPack,
  DEFAULT_CROP_RECT_OPTION,
  DEFAULT_SETTINGS,
  DEFAULT_THRESHOLD,
  type OutputPackFailure,
  type Settings,
  SettingsSchema,
  type Species,
  type Type,
} from "./asb/types/index.js";
import { toOutputPackFailure } from "./asb/util.js";

export * from "./asb/types/index.js";

export function createSettings(settings?: Partial<Settings>): Settings {
  return v.parse(SettingsSchema, { ...DEFAULT_SETTINGS, ...settings });
}

export * from "./asb/ocr/normalize.js";
export { createSpeciesList } from "./asb/species.js";

export function searchBP(
  speciesList: Species[],
  name: string,
  settings: Settings,
): string {
  return searchSpecies(speciesList, name, settings).blueprintPath;
}
export * from "./asb/ocr/manager.js";
/**
 * 入力
 * レベル↔個体値共通の入力
 */
export interface InputCommon {
  /** 個体を識別するkey
   * Species.blueprintPath←これ
   * もとは生物ごとの設定ファイルのpathだけど、重複がないのでkeyとして使う
   * */
  bp: string;
  /** 個体のタイプ(wild:野生の個体, dom:野生をテイムした個体, bred:ブリーディングした個体) */
  type: Type;

  /** 刷り込み(0~1) type が "bred" の場合にのみ有効 */
  imprinting: number;

  speciesList: Species[];
  settings: Settings;
}

/**
 * 入出力(共通)
 * レベル→個体値の入力
 * 個体値→レベルの出力
 */
export interface InputForCalculateValueAndOutputOfCalculateLevel {
  /** テイム効果(0~1) type が "dom" の場合にのみ有効 */
  tameEffectiveness: number;
}

/** 入力: レベル→個体値 */
export type InputForCalculateValue = Omit<
  CalculateValueInputPack,
  "species" | "imprinting" | "tameEffectiveness"
> &
  InputCommon &
  InputForCalculateValueAndOutputOfCalculateLevel;

/** 出力: レベル→個体値 */
export type OutputOfCalculateValue = CalculateValueOutputPack;

/** 入力: 個体値→レベル */
export type InputForCalculateLevel = Omit<
  CalculateLevelInputPack,
  "species" | "imprinting" | "totalLevel" | "withDom"
> &
  InputCommon & { totalLevel: number } & { withDom: boolean };

/** 出力: 個体値→レベル */
export type OutputOfCalculateLevel =
  | (Omit<
      Extract<CalculateLevelOutputPack, { status: "success" }>,
      "tameEffectiveness"
    > &
      InputForCalculateValueAndOutputOfCalculateLevel)
  | Exclude<CalculateLevelOutputPack, { status: "success" }>;

function notFoundSpeciesError(input: InputCommon): OutputPackFailure {
  return {
    status: "failure",
    errorType: "input_error",
    errors: [
      {
        path: "root",
        message: `speciesList 内にbp と一致するものがありません。bp: ${input.bp}`,
      },
    ],
  };
}

export function calculateValue(
  input: InputForCalculateValue,
): OutputOfCalculateValue {
  const found = input.speciesList.find((s) => s.blueprintPath === input.bp);
  if (!found) {
    return notFoundSpeciesError(input);
  }
  const parsed = v.safeParse(CalculateValueInputPackSchema, {
    type: input.type,
    levels: input.levels,
    tameEffectiveness: input.tameEffectiveness,
    imprinting: input.imprinting,
    species: found,
    settings: input.settings,
  });
  if (parsed.success) {
    return calculateValueController(parsed.output);
  } else {
    return toOutputPackFailure("input_error", parsed.issues);
  }
}

import { normalizeTexts } from "./asb/ocr/normalize.js";
export function calculateLevel(
  input: InputForCalculateLevel,
): OutputOfCalculateLevel {
  const found = input.speciesList.find((s) => s.blueprintPath === input.bp);
  if (!found) {
    return notFoundSpeciesError(input);
  }
  const parsed = v.safeParse(CalculateLevelInputPackSchema, {
    type: input.type,
    values: input.values,
    withDom: input.withDom,
    totalLevel: input.totalLevel,
    imprinting: input.imprinting,
    species: found,
    settings: input.settings,
  });
  if (parsed.success) {
    return calculateLevelController(parsed.output);
  } else {
    return toOutputPackFailure("input_error", parsed.issues);
  }
}

export type ExtractTextsOutput = ReturnType<typeof extractTexts>;

export function extractTexts(
  manager: OcrQueueManager,
  sourceImg: HTMLImageElement,
  ymNL = DEFAULT_CROP_RECT_OPTION.ymNL,
  dlmNL = DEFAULT_CROP_RECT_OPTION.dlmNL,
  drmNL = DEFAULT_CROP_RECT_OPTION.drmNL,
  dhmNL = DEFAULT_CROP_RECT_OPTION.dhmNL,
  ymS = DEFAULT_CROP_RECT_OPTION.ymS,
  dlmS = DEFAULT_CROP_RECT_OPTION.dlmS,
  drmS = DEFAULT_CROP_RECT_OPTION.drmS,
  dhmS = DEFAULT_CROP_RECT_OPTION.dhmS,
  threshold = DEFAULT_THRESHOLD,
) {
  const cropRects = calcCropRects(
    sourceImg.width,
    sourceImg.height,
    ymNL,
    dlmNL,
    drmNL,
    dhmNL,
    ymS,
    dlmS,
    drmS,
    dhmS,
  );
  const croppedImages = cropOcrImages(sourceImg, threshold, cropRects);
  const extractedPromiseTexs = extractOcrPromiseTexts(manager, croppedImages);

  const resultPromise = extractOcrTexts(extractedPromiseTexs).then(
    (extractedTexs) => normalizeTexts(extractedTexs),
  );

  return {
    result: {
      cropRects,
      croppedImages,
      extractedPromiseTexs,
    },
    resultPromise,
  };
}
