import * as v from "valibot";
import { PositiveValueSchema } from "./common.js";
import { SettingsSchema } from "./settings.js";
import { SpeciesSchema } from "./species.js";
import { type StatsName, StatsNames } from "./stats-name.js";

export const LevelSchema = v.pipe(v.number(), v.integer(), v.minValue(0));

export type LevelDetail = v.InferOutput<typeof LevelDetailSchema>;
export const LevelDetailSchema = v.object({
  wild: LevelSchema,
  mut: LevelSchema,
  dom: LevelSchema,
});

export type Levels = v.InferOutput<typeof LevelsSchema>;
export const LevelsSchema = v.object(
  v.entriesFromList(StatsNames, LevelDetailSchema),
);

export type Values = v.InferOutput<typeof ValuesSchema>;
export const ValuesSchema = v.object(
  v.entriesFromList(StatsNames, PositiveValueSchema),
);

export type Type = (typeof Types)[number];
export const Types = ["wild", "dom", "bred"] as const;

export type TameEffectiveness = v.InferOutput<typeof TameEffectivenessSchema>;
export const TE_MIN = 0;
export const TE_MAX = 1;
export const TameEffectivenessSchema = v.pipe(
  v.number(),
  v.minValue(TE_MIN),
  v.maxValue(TE_MAX),
  v.brand("" as "TameEffectivenessSchema"), // 単品で使いそうなので、v.brandする
);

export type Imprinting = v.InferOutput<typeof ImprintingSchema>;
export const IMP_MIN = 0;
export const IMP_MAX = 1;
export const ImprintingSchema = v.pipe(
  v.number(),
  v.minValue(IMP_MIN),
  v.maxValue(IMP_MAX),
  v.brand("" as "ImprintingSchema"), // 単品で使いそうなので、v.brandする
);

// 野生はテイム効果なしで計算する。
export const WILD_TE = TE_MIN as TameEffectiveness;
// 野生は刷り込みボーナスなしで計算する。
export const WILD_IMP = IMP_MIN as Imprinting;
// テイム後は刷り込みボーナスなしで計算する。
export const DOM_IMP = IMP_MIN as Imprinting;
// ブリはテイム効果1で計算する。
export const BRED_TE = TE_MAX as TameEffectiveness;

export type CalculateValueInputPack = v.InferOutput<
  typeof CalculateValueInputPackSchema
>;
export const CalculateValueInputPackSchema = v.variant("type", [
  v.object({
    type: v.literal("wild" satisfies Type),
    levels: LevelsSchema,
    tameEffectiveness: TameEffectivenessSchema,
    imprinting: ImprintingSchema,
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
  v.object({
    type: v.literal("dom" satisfies Type),
    levels: LevelsSchema,
    tameEffectiveness: TameEffectivenessSchema,
    imprinting: ImprintingSchema,
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
  v.object({
    type: v.literal("bred" satisfies Type),
    levels: LevelsSchema,
    tameEffectiveness: TameEffectivenessSchema,
    imprinting: ImprintingSchema,
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
]);

export type CalculateLevelInputPack = v.InferOutput<
  typeof CalculateLevelInputPackSchema
>;
export const CalculateLevelInputPackSchema = v.variant("type", [
  v.object({
    type: v.literal("wild" satisfies Type),
    values: ValuesSchema,
    imprinting: ImprintingSchema,
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
  v.object({
    type: v.literal("dom" satisfies Type),
    values: ValuesSchema,
    imprinting: ImprintingSchema,
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
  v.object({
    type: v.literal("bred" satisfies Type),
    values: ValuesSchema,
    imprinting: ImprintingSchema,
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
]);
export interface StatsMetaDetail {
  valueDiff?: number;
  equalWildMutationRates?: boolean;
  isMutLevelCalculatedAsZero?: boolean;
  isDomLevelCalculatedAsZero?: boolean;
  hasMissingStatsForCalculation?: boolean;
}
export type StatsMeta = Partial<Record<StatsName, StatsMetaDetail>>;

export interface Meta {
  statsMeta: StatsMeta;
  isTameEffectivenessCalculatedAsZero?: boolean;
  isTameEffectivenessCalculatedAsOne?: boolean;
  isImprintingCalculatedAsZero?: boolean;
}

export type ErrorType = ["input_error", "internal_error"][number];

export interface ASBError {
  path: string;
  message: string;
}

export interface OutputPackSuccess {
  status: "success";
  meta: Meta;
}

export interface OutputPackFailure {
  status: "failure";
  errorType: ErrorType;
  errors: ASBError[];
}

export type CalculateValueOutputPack =
  | CalculateValueOutputPackSuccess
  | CalculateValueOutputPackFailure;

export interface CalculateValueOutputPackSuccess extends OutputPackSuccess {
  values: Values;
}

export interface CalculateValueOutputPackFailure extends OutputPackFailure {}

export type CalculateLevelOutputPack =
  | CalculateLevelOutputPackSuccess
  | CalculateLevelOutputPackFailure;

export interface CalculateLevelOutputPackSuccess extends OutputPackSuccess {
  levels: Levels;
  tameEffectiveness: TameEffectiveness;
}

export interface CalculateLevelOutputPackFailure extends OutputPackFailure {}
