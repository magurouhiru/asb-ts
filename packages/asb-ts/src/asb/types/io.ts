import * as v from "valibot";
import { PositiveValueSchema } from "./common.js";
import { SettingsSchema } from "./settings.js";
import { SpeciesSchema } from "./species.js";
import { type StatsName, StatsNames } from "./stats-name.js";

export const LevelSchema = v.message(
  v.pipe(v.number(""), v.integer(), v.minValue(0)),
  (issue) =>
    `Level には0 以上の整数を指定してください。入力値 ${issue.input} は${issue.message}`,
);

export type LevelDetail = v.InferOutput<typeof LevelDetailSchema>;
export const LevelDetailSchema = v.message(
  v.object({
    wild: LevelSchema,
    mut: LevelSchema,
    dom: LevelSchema,
  }),
  (issue) => (issue.type === "object" ? `Levelは` : issue.message),
);

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
  v.brand("" as "TameEffectivenessSchema"),
);

export type Imprinting = v.InferOutput<typeof ImprintingSchema>;
export const IMP_MIN = 0;
export const IMP_MAX = 1;
export const ImprintingSchema = v.pipe(
  v.number(),
  v.minValue(IMP_MIN),
  v.maxValue(IMP_MAX),
  v.brand("" as "ImprintingSchema"),
);

// 野生はテイム効果なしで計算する。
export const WILD_TE = TE_MIN as TameEffectiveness;
const WildTeSchema = v.pipe(
  v.fallback(v.literal(TE_MIN), TE_MIN),
  v.brand("" as "TameEffectivenessSchema"),
);

// 野生は刷り込みボーナスなしで計算する。
export const WILD_IMP = IMP_MIN as Imprinting;
const WildImpSchema = v.pipe(
  v.fallback(v.literal(IMP_MIN), IMP_MIN),
  v.brand("" as "ImprintingSchema"),
);

// テイム後は刷り込みボーナスなしで計算する。
export const DOM_IMP = IMP_MIN as Imprinting;
const DomImpSchema = v.pipe(
  v.fallback(v.literal(IMP_MIN), IMP_MIN),
  v.brand("" as "ImprintingSchema"),
);

// ブリはテイム効果1で計算する。
export const BRED_TE = TE_MAX as TameEffectiveness;
const BredTeSchema = v.pipe(
  v.fallback(v.literal(TE_MAX), TE_MAX),
  v.brand("" as "TameEffectivenessSchema"),
);

export type CalculateValueInputPack = v.InferOutput<
  typeof CalculateValueInputPackSchema
>;
export const CalculateValueInputPackSchema = v.variant("type", [
  v.object({
    type: v.literal("wild" satisfies Type),
    levels: LevelsSchema,
    tameEffectiveness: WildTeSchema,
    imprinting: WildImpSchema,
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
  v.object({
    type: v.literal("dom" satisfies Type),
    levels: LevelsSchema,
    tameEffectiveness: TameEffectivenessSchema,
    imprinting: DomImpSchema,
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
  v.object({
    type: v.literal("bred" satisfies Type),
    levels: LevelsSchema,
    tameEffectiveness: BredTeSchema,
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
    imprinting: WildImpSchema,
    species: SpeciesSchema,
    settings: SettingsSchema,
  }),
  v.object({
    type: v.literal("dom" satisfies Type),
    values: ValuesSchema,
    imprinting: DomImpSchema,
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

export type StatsMetaDetail = {
  schemaError?: string;
  valueDiff?: number;
};
export type StatsMeta = Partial<Record<StatsName, StatsMetaDetail>>;

export interface Meta {
  hasError: boolean;
  statsMeta: StatsMeta;
}
