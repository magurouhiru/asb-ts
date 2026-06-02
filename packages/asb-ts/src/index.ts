import * as v from "valibot";
import {
  calculateLevelController,
  calculateValueController,
} from "./asb/calculator.js";
import { searchSpecies } from "./asb/species.js";
import {
  type CalculateLevelInputPack,
  CalculateLevelInputPackSchema,
  type CalculateValueInputPack,
  CalculateValueInputPackSchema,
  DEFAULT_SETTINGS,
  type Meta,
  type Settings,
  SettingsSchema,
  type Species,
  type Type,
} from "./asb/types/index.js";

export * from "./asb/types/index.js";

export function createSettings(settings?: Partial<Settings>): Settings {
  return v.parse(SettingsSchema, { ...DEFAULT_SETTINGS, ...settings });
}

export { createSpeciesList } from "./asb/species.js";

export function searchBP(
  speciesList: Species[],
  name: string,
  settings: Settings,
): string {
  return searchSpecies(speciesList, name, settings).blueprintPath;
}

/** ステータス名 */
export type StatsName = (typeof STATS_NAMES)[number];
/** ステータス名の配列 */
export const STATS_NAMES = [
  /** 体力 */
  "health",
  /** スタミナ */
  "stamina",
  /** 酸素量 */
  "oxygen",
  /** 食料 */
  "food",

  // "water", // 無視
  // "temperature", // 無視
  /** 重量 */
  "weight",
  /** 近接攻撃力 */
  "meleeDamageMultiplier",

  // "speedMultiplier", // 無視
  // "temperatureFortitude", // 無視
  // "craftingSpeedMultiplier", // 無視
  /** 気絶値 */
  "torpidity",
] as const;

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

  /** 刷り込みボーナス(0~1) type が "bred" の場合にのみ有効 */
  imp: number;

  speciesList: Species[];
  settings: Settings;
}

/**
 * ステータスのレベルの型
 * 入出力(共通)
 * レベル→個体値の入力
 * 個体値→レベルの出力
 */
export type StatsLevels = Record<
  StatsName,
  {
    /** 野生のレベル(0以上の整数) */
    wild: number;
    /** 変異のレベル(0以上の整数) @alpha 未実装機能向け */
    mut: number;
    /** テイム後に割り振ったレベル(0以上の整数) @alpha 未実装機能向け */
    dom: number;
  }
>;

/**
 * ステータスの値の型
 * 入出力(共通)
 * 個体値→レベルの入力
 * レベル→個体値の出力
 */
export type StatsValues = Record<
  StatsName,
  /** ステータスの値(0以上の数値) */
  number
>;

/**
 * 入出力(共通)
 * レベル→個体値の入力
 * 個体値→レベルの出力
 */
export interface InputForCalculateValueAndOutputOfCalculateLevel {
  /** テイム効果(0~1) type が "dom" の場合にのみ有効 */
  te: number;
}

/**
 * ステータス毎のエラー情報の型
 */
export type StatsError = Record<
  StatsName,
  {
    /** エラーメッセージ */
    errorMessage: string | null;
    /** エラーの値(計算した値 - 実際の値) */
    errorValue: number | null;
  }
>;

/** 入力: レベル→個体値 */
export interface InputForCalculateValue
  extends InputCommon,
    InputForCalculateValueAndOutputOfCalculateLevel {
  levels: StatsLevels;
}

/** 出力: レベル→個体値 */
export interface OutputOfCalculateValue {
  values: StatsValues;
  meta: Meta;
}

/** 入力: 個体値→レベル */
export interface InputForCalculateLevel extends InputCommon {
  values: StatsValues;
}

/** 出力: 個体値→レベル */
export interface OutputOfCalculateLevel
  extends InputForCalculateValueAndOutputOfCalculateLevel {
  levels: StatsLevels;
  meta: Meta;
}

export function toCalculateValueInputPack(
  input: InputForCalculateValue,
): CalculateValueInputPack {
  const found = input.speciesList.find((s) => s.blueprintPath === input.bp);
  if (!found) {
    throw new Error(`species not found for bp: ${input.bp}`);
  }
  return v.parse(CalculateValueInputPackSchema, {
    type: input.type,
    levels: {
      ...input.levels,
      water: { wild: 0, mut: 0, dom: 0 }, // 無視
      temperature: { wild: 0, mut: 0, dom: 0 }, // 無視
      speedMultiplier: { wild: 0, mut: 0, dom: 0 }, // 無視
      temperatureFortitude: { wild: 0, mut: 0, dom: 0 }, // 無視
      craftingSpeedMultiplier: { wild: 0, mut: 0, dom: 0 }, // 無視
    },
    te: input.te,
    imprinting: input.imp,
    species: found,
    settings: input.settings,
  });
}

export function calculateValue(
  input: InputForCalculateValue,
): OutputOfCalculateValue {
  const [values, meta] = calculateValueController(
    toCalculateValueInputPack(input),
  );
  return { values, meta };
}

function toCalculateLevelInputPack(
  input: InputForCalculateLevel,
): CalculateLevelInputPack {
  const found = input.speciesList.find((s) => s.blueprintPath === input.bp);
  if (!found) {
    throw new Error(`species not found for bp: ${input.bp}`);
  }
  return v.parse(CalculateLevelInputPackSchema, {
    type: input.type,
    values: {
      ...input.values,
      water: 0, // 無視
      temperature: 0, // 無視
      speedMultiplier: 0, // 無視
      temperatureFortitude: 0, // 無視
      craftingSpeedMultiplier: 0, // 無視
    },
    imprinting: input.imp,
    species: found,
    settings: input.settings,
  });
}

export function calculateLevel(
  input: InputForCalculateLevel,
): OutputOfCalculateLevel {
  const [levels, te, meta] = calculateLevelController(
    toCalculateLevelInputPack(input),
  );
  return { levels, te, meta };
}
