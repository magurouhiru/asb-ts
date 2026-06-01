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
  type Levels,
  type Settings,
  SettingsSchema,
  type Species,
  type TameEffectiveness,
  type Type,
  type Values,
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

/**
 * レベル→個体値の算出に必要な情報をまとめたもの
 */
export interface InputForCalculateValue {
  /** 個体を識別するkey
   * Species.blueprintPath←これ
   * もとは生物ごとの設定ファイルのpathだけど、重複がないのでkeyとして使う
   * */
  bp: string;

  /** 個体のタイプ(wild:野生の個体, dom:野生をテイムした個体, bred:ブリーディングした個体) */
  type: Type;

  /** 体力の野生のレベル */
  h_l_w: number;
  /** 体力の変異のレベル @alpha 未実装機能向け */
  h_l_m: number;
  /** 体力のテイム後に割り振ったレベル @alpha 未実装機能向け */
  h_l_d: number;

  /** スタミナの野生のレベル */
  s_l_w: number;
  /** スタミナの変異のレベル @alpha 未実装機能向け */
  s_l_m: number;
  /** スタミナのテイム後に割り振ったレベル @alpha 未実装機能向け */
  s_l_d: number;

  /** 酸素量の野生のレベル */
  o_l_w: number;
  /** 酸素量の変異のレベル @alpha 未実装機能向け */
  o_l_m: number;
  /** 酸素量のテイム後に割り振ったレベル @alpha 未実装機能向け */
  o_l_d: number;

  /** 食料の野生のレベル */
  f_l_w: number;
  /** 食料の変異のレベル @alpha 未実装機能向け */
  f_l_m: number;
  /** 食料のテイム後に割り振ったレベル @alpha 未実装機能向け */
  f_l_d: number;

  /** 重量の野生のレベル */
  w_l_w: number;
  /** 重量の変異のレベル @alpha 未実装機能向け */
  w_l_m: number;
  /** 重量のテイム後に割り振ったレベル @alpha 未実装機能向け */
  w_l_d: number;

  /** 近接攻撃力の野生のレベル */
  m_l_w: number;
  /** 近接攻撃力の変異のレベル @alpha 未実装機能向け */
  m_l_m: number;
  /** 近接攻撃力のテイム後に割り振ったレベル @alpha 未実装機能向け */
  m_l_d: number;

  /** 気絶値の野生のレベル */
  t_l_w: number;
  /** 気絶値の変異のレベル @alpha 未実装機能向け */
  t_l_m: number;
  /** 気絶値のテイム後に割り振ったレベル @alpha 未実装機能向け */
  t_l_d: number;

  /** テイム効果(0~1) type が "dom" の場合にのみ有効 */
  te: number;

  /** 刷り込みボーナス(0~1) type が "bred" の場合にのみ有効 */
  imp: number;

  speciesList: Species[];
  settings: Settings;
}

function toCalculateValueInputPack(
  input: InputForCalculateValue,
): CalculateValueInputPack {
  const found = input.speciesList.find((s) => s.blueprintPath === input.bp);
  if (!found) {
    throw new Error(`species not found for bp: ${input.bp}`);
  }
  return v.parse(CalculateValueInputPackSchema, {
    type: input.type,
    levels: {
      health: { wild: input.h_l_w, mut: input.h_l_m, dom: input.h_l_d },
      stamina: { wild: input.s_l_w, mut: input.s_l_m, dom: input.s_l_d },
      oxygen: { wild: input.o_l_w, mut: input.o_l_m, dom: input.o_l_d },
      food: { wild: input.f_l_w, mut: input.f_l_m, dom: input.f_l_d },

      water: { wild: 0, mut: 0, dom: 0 }, // 無視
      temperature: { wild: 0, mut: 0, dom: 0 }, // 無視
      weight: { wild: input.w_l_w, mut: input.w_l_m, dom: input.w_l_d },
      meleeDamageMultiplier: {
        wild: input.m_l_w,
        mut: input.m_l_m,
        dom: input.m_l_d,
      },

      speedMultiplier: { wild: 0, mut: 0, dom: 0 }, // 無視
      temperatureFortitude: { wild: 0, mut: 0, dom: 0 }, // 無視
      craftingSpeedMultiplier: { wild: 0, mut: 0, dom: 0 }, // 無視
      torpidity: { wild: input.t_l_w, mut: input.t_l_m, dom: input.t_l_d },
    },
    te: input.te,
    imprinting: input.imp,
    species: found,
    settings: input.settings,
  });
}

export function calculateValue(input: InputForCalculateValue): Values {
  return calculateValueController(toCalculateValueInputPack(input));
}

/**
 * 個体値→レベルの算出に必要な情報をまとめたもの
 */
export interface InputForCalculateLevel {
  /** 個体を識別するkey
   * Species.blueprintPath←これ
   * もとは生物ごとの設定ファイルのpathだけど、重複がないのでkeyとして使う
   * */
  bp: string;

  /** 個体のタイプ(wild:野生の個体, dom:野生をテイムした個体, bred:ブリーディングした個体) */
  type: Type;

  /** 体力の値 */
  h_v: number;
  /** スタミナの値 */
  s_v: number;
  /** 酸素量の値 */
  o_v: number;

  /** 食料の値 */
  f_v: number;
  /** 重量の値 */
  w_v: number;
  /** 近接攻撃力の値 */
  m_v: number;

  /** 気絶値の値 */
  t_v: number;
  /** 刷り込みボーナス(0~1) type が "bred" の場合にのみ有効 */
  imp: number;

  speciesList: Species[];
  settings: Settings;
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
      health: input.h_v,
      stamina: input.s_v,
      oxygen: input.o_v,
      food: input.f_v,

      water: 0, // 無視
      temperature: 0, // 無視
      weight: input.w_v,
      meleeDamageMultiplier: input.m_v,

      speedMultiplier: 0, // 無視
      temperatureFortitude: 0, // 無視
      craftingSpeedMultiplier: 0, // 無視
      torpidity: input.t_v,
    } satisfies Values,
    imprinting: input.imp,
    species: found,
    settings: input.settings,
  });
}

export function calculateLevel(
  input: InputForCalculateLevel,
): [Levels, TameEffectiveness] {
  return calculateLevelController(toCalculateLevelInputPack(input));
}
