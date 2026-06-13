import * as v from "valibot";
import {
  calculateLevelController,
  calculateValueController,
} from "./asb/calculator.js";
import { searchSpecies } from "./asb/species.js";
import {
  type CalculateLevelInputPack,
  CalculateLevelInputPackSchema,
  type CalculateLevelOutputPack,
  type CalculateValueInputPack,
  CalculateValueInputPackSchema,
  type CalculateValueOutputPack,
  DEFAULT_REGIONS_OPTION,
  DEFAULT_SETTINGS,
  DEFAULT_THRESHOLD,
  type OutputPackFailure,
  type ReadOutput,
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

import { getImgPacks } from "./asb/ocr.browser.js";
import {
  getNormalizedTexts,
  getOcrTexts,
  getRegions,
  type OcrQueueManager,
} from "./asb/ocr.js";

export * from "./asb/ocr.js";
export { createSpeciesList } from "./asb/species.js";

export function searchBP(
  speciesList: Species[],
  name: string,
  settings: Settings,
): string {
  return searchSpecies(speciesList, name, settings).blueprintPath;
}

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

export async function read(
  manager: OcrQueueManager,
  sourceImg: HTMLImageElement,
  ymNL = DEFAULT_REGIONS_OPTION.ymNL,
  dlmNL = DEFAULT_REGIONS_OPTION.dlmNL,
  drmNL = DEFAULT_REGIONS_OPTION.drmNL,
  dhmNL = DEFAULT_REGIONS_OPTION.dhmNL,
  ymS = DEFAULT_REGIONS_OPTION.ymS,
  dlmS = DEFAULT_REGIONS_OPTION.dlmS,
  drmS = DEFAULT_REGIONS_OPTION.drmS,
  dhmS = DEFAULT_REGIONS_OPTION.dhmS,
  threshold = DEFAULT_THRESHOLD,
): Promise<ReadOutput> {
  const regions = getRegions(
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
  const imgPacks = getImgPacks(sourceImg, threshold, regions);
  const ocrTexts = await getOcrTexts(manager, imgPacks);
  const ocrTextsClone = structuredClone(ocrTexts);
  const { normalizedTexts, meta } = getNormalizedTexts(ocrTextsClone);
  return {
    regions,
    imgPacks,
    ocrTexts,
    normalizedTexts,
    meta,
  };
}
