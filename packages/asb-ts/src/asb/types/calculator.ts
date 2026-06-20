import * as v from "valibot";
import {
  PositiveIntegerSchema,
  type PositiveNumber,
  PositiveNumberSchema,
} from "./common.js";
import { SettingsSchema } from "./settings.js";
import { SpeciesSchema } from "./species.js";
import { STAT_LABELS, type StatLabel } from "./stat-name.js";

export type LevelDetail = v.InferOutput<typeof LevelDetailSchema>;
export const LevelDetailSchema = v.object({
  wild: PositiveIntegerSchema,
  mut: PositiveIntegerSchema,
  dom: PositiveIntegerSchema,
});

export type StatLevelsUnsafe = v.InferInput<typeof StatLevelsSchema>;
export type StatLevels = v.InferOutput<typeof StatLevelsSchema>;
export const StatLevelsSchema = v.object(
  v.entriesFromList(STAT_LABELS, v.undefinedable(LevelDetailSchema)),
);

export type StatValuesUnsafe = v.InferInput<typeof StatValuesSchema>;
export type StatValues = v.InferOutput<typeof StatValuesSchema>;
export const StatValuesSchema = v.object(
  v.entriesFromList(STAT_LABELS, v.undefinedable(PositiveNumberSchema)),
);

export type StatsType = v.InferOutput<typeof StatsTypeSchema>;
export const STATS_TYPES = ["wild", "dom", "bred"] as const;
export const StatsTypeSchema = v.picklist(STATS_TYPES);

export type TameEffectiveness = v.InferOutput<typeof TameEffectivenessSchema>;
export const TE_MIN = 0 as PositiveNumber;
export const TE_MAX = 1 as PositiveNumber;
export const TameEffectivenessSchema = v.pipe(
  PositiveNumberSchema,
  v.maxValue(TE_MAX),
  v.brand("" as "TameEffectivenessSchema"), // 単品で使いそうなので、v.brandする
);

export type Imprinting = v.InferOutput<typeof ImprintingSchema>;
export const IMP_MIN = 0 as PositiveNumber;
export const IMP_MAX = 1 as PositiveNumber;
export const ImprintingSchema = v.pipe(
  PositiveNumberSchema,
  v.maxValue(IMP_MAX),
  v.brand("" as "ImprintingSchema"), // 単品で使いそうなので、v.brandする
);

export type TotalLevel = v.InferOutput<typeof TotalLevelSchema>;
export const TL_MIN = 0;
export const TotalLevelSchema = v.pipe(
  PositiveIntegerSchema,
  v.brand("" as "TotalLevelSchema"), // 単品で使いそうなので、v.brandする
);

export type WithDom = v.InferOutput<typeof WithDomSchema>;
export const WithDomSchema = v.pipe(
  v.boolean(),
  v.brand("" as "WithDomSchema"), // 単品で使いそうなので、v.brandする
);

// 野生はテイム効果なしで計算する。
export const WILD_TE = TE_MIN as TameEffectiveness;
// 野生は刷り込みボーナスなしで計算する。
export const WILD_IMP = IMP_MIN as Imprinting;
// テイム後は刷り込みボーナスなしで計算する。
export const DOM_IMP = IMP_MIN as Imprinting;
// ブリはテイム効果1で計算する。
export const BRED_TE = TE_MAX as TameEffectiveness;

export type CalculateValueInputPackUnsafe = v.InferInput<
  typeof CalculateValueInputPackSchema
>;
export type CalculateValueInputPack = v.InferOutput<
  typeof CalculateValueInputPackSchema
>;
export const CalculateValueInputPackSchema = v.variant("type", [
  v.object({
    type: v.literal("wild" satisfies StatsType),
    levels: StatLevelsSchema,
    tameEffectiveness: v.pipe(
      v.number(),
      v.literal(WILD_TE),
      TameEffectivenessSchema,
    ),
    imprinting: v.pipe(v.number(), v.literal(WILD_IMP), ImprintingSchema),
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
  v.object({
    type: v.literal("dom" satisfies StatsType),
    levels: StatLevelsSchema,
    tameEffectiveness: TameEffectivenessSchema,
    imprinting: v.pipe(v.number(), v.literal(DOM_IMP), ImprintingSchema),
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
  v.object({
    type: v.literal("bred" satisfies StatsType),
    levels: StatLevelsSchema,
    tameEffectiveness: v.pipe(
      v.literal(BRED_TE),
      v.toNumber(),
      TameEffectivenessSchema,
    ),
    imprinting: ImprintingSchema,
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
]);

export type CalculateLevelInputPackUnsafe = v.InferInput<
  typeof CalculateLevelInputPackSchema
>;
export type CalculateLevelInputPack = v.InferOutput<
  typeof CalculateLevelInputPackSchema
>;
export const CalculateLevelInputPackSchema = v.variant("type", [
  v.object({
    type: v.literal("wild" satisfies StatsType),
    values: StatValuesSchema,
    withDom: WithDomSchema,
    totalLevel: TotalLevelSchema,
    imprinting: v.pipe(v.number(), v.literal(WILD_IMP), ImprintingSchema),
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
  v.object({
    type: v.literal("dom" satisfies StatsType),
    values: StatValuesSchema,
    withDom: WithDomSchema,
    totalLevel: TotalLevelSchema,
    imprinting: v.pipe(v.number(), v.literal(DOM_IMP), ImprintingSchema),
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
  v.object({
    type: v.literal("bred" satisfies StatsType),
    values: StatValuesSchema,
    withDom: WithDomSchema,
    totalLevel: TotalLevelSchema,
    imprinting: ImprintingSchema,
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
]);

export type StatDiff = Record<StatLabel, number | undefined>;

export interface CalculateValueOutputPack {
  values: StatValues;
}

export interface CalculateLevelOutputPack {
  levels: StatLevels;
  tameEffectiveness: TameEffectiveness;
  diffs: StatDiff;
}
