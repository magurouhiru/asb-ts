import * as v from "valibot";
import { ModNameSchema } from "../migration/values/index.js";
import { VariantSchema } from "../migration/variants/index.js";
import { PositiveNumberSchema } from "./common.js";
import { STAT_LABELS } from "./stat-name.js";

/**
 * packages/asb-ts/ARKStatsExtractor/ARKBreedingStats/species/SpeciesStat.cs
 */
export type SpeciesStat = v.InferOutput<typeof SpeciesStatSchema>;
export const SpeciesStatSchema = v.object({
  baseValue: PositiveNumberSchema,
  incPerWildLevel: PositiveNumberSchema,
  incPerDomLevel: PositiveNumberSchema,
  additiveBonus: v.number(),
  multiplicativeBonus: PositiveNumberSchema,
});

/**
 * asb-ts/ARKStatsExtractor/ARKBreedingStats/Ark.cs
 */
export type Stats = v.InferOutput<typeof StatsSchema>;
export const StatsSchema = v.object(
  v.entriesFromList(STAT_LABELS, v.undefinedable(SpeciesStatSchema)),
);

export type StatImprintMultDetail = v.InferOutput<
  typeof StatImprintMultDetailSchema
>;
export const StatImprintMultDetailSchema = v.pipe(
  v.number(),
  v.brand("" as "StatImprintMultDetailSchema"),
);

export type StatsImprintMultiplier = v.InferOutput<
  typeof StatsImprintMultiplierSchema
>;
export const StatsImprintMultiplierSchema = v.object(
  v.entriesFromList(STAT_LABELS, StatImprintMultDetailSchema),
);

export type BlueprintPath = v.InferOutput<typeof BlueprintPathSchema>;
export const BlueprintPathSchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.brand("" as "BlueprintPathSchema"),
);

export type MutationMultiplierItem = v.InferOutput<
  typeof MutationMultiplierItemSchema
>;
export const MutationMultiplierItemSchema = v.pipe(
  v.number(),
  v.brand("" as "MutationMultiplierItemSchema"),
);

export type MutationMultiplier = v.InferOutput<typeof MutationMultiplierSchema>;
export const MutationMultiplierSchema = v.object(
  v.entriesFromList(STAT_LABELS, MutationMultiplierItemSchema),
);

export type TamedBaseHealthMultiplier = v.InferOutput<
  typeof TamedBaseHealthMultiplierSchema
>;
export const TamedBaseHealthMultiplierSchema = v.pipe(
  v.number(),
  v.brand("" as "TamedBaseHealthMultiplierSchema"),
);

export type Species = v.InferOutput<typeof SpeciesSchema>;
export const SpeciesSchema = v.object({
  name: v.string(),
  blueprintPath: BlueprintPathSchema,
  variants: v.array(VariantSchema),
  mod: v.nullable(ModNameSchema),
  stats: StatsSchema,
  statImprintMultiplier: v.undefinedable(StatsImprintMultiplierSchema),
  mutationMultiplier: v.undefinedable(MutationMultiplierSchema),
  tamedBaseHealthMultiplier: v.undefinedable(TamedBaseHealthMultiplierSchema),
});

// Default values for the stat imprint multipliers in ASE
export const DEFAULT_STAT_IMPRINT_MULTIPLIER = {
  health: 0.2,
  stamina: 0,
  torpidity: 0.2,
  oxygen: 0,

  food: 0.2,
  water: 0.2,
  temperature: 0,
  weight: 0.2,

  meleeDamageMultiplier: 0.2,
  speedMultiplier: 0.2,
  temperatureFortitude: 0,
  craftingSpeedMultiplier: 0,
} as const satisfies v.InferInput<
  typeof StatsImprintMultiplierSchema
> as StatsImprintMultiplier;

export const DEFAULT_TBHM = 1 satisfies v.InferInput<
  typeof TamedBaseHealthMultiplierSchema
> as TamedBaseHealthMultiplier;

export const DEFAULT_MUTATION_MULTIPLIER = {
  health: 1,
  stamina: 1,
  torpidity: 1,
  oxygen: 1,

  food: 1,
  water: 1,
  temperature: 1,
  weight: 1,

  meleeDamageMultiplier: 1,
  speedMultiplier: 1,
  temperatureFortitude: 1,
  craftingSpeedMultiplier: 1,
} as const satisfies v.InferInput<
  typeof MutationMultiplierSchema
> as MutationMultiplier;
