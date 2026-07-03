import * as v from "valibot";

/*
  元のARKStatsExtractorベースの定義
*/

/**
 * /ARKStatsExtractor/ARKBreedingStats/species/Species.cs
 * 0: baseValue
 * 1: incPerWildLevel
 * 2: incPerDomLevel
 * 3: addBonus
 * 4: multBonus
 */
export type StatsRow = v.InferOutput<typeof StatsRowSchema>;
export type StatsRowIn = v.InferInput<typeof StatsRowSchema>;
export const StatsRowSchema = v.tuple([
  v.number(),
  v.number(),
  v.number(),
  v.number(),
  v.number(),
]);

/**
 * /ARKStatsExtractor/ARKBreedingStats/Ark.cs
 * fullStatsRaw:
 *   0:  Health
 *   1:  Stamina
 *   2:  Torpidity
 *   3:  Oxygen
 *
 *   4:  Food
 *   5:  Water
 *   6:  Temperature
 *   7:  Weight
 *
 *   8:  MeleeDamageMultiplier
 *   9:  SpeedMultiplier
 *   10: TemperatureFortitude
 *   11: CraftingSpeedMultiplier
 */
export type FullStatsRaw = v.InferOutput<typeof FullStatsRawSchema>;
export type FullStatsRawIn = v.InferInput<typeof FullStatsRawSchema>;
export const FullStatsRawSchema = v.tuple([
  v.nullable(StatsRowSchema),
  v.nullable(StatsRowSchema),
  v.nullable(StatsRowSchema),
  v.nullable(StatsRowSchema),

  v.nullable(StatsRowSchema),
  v.nullable(StatsRowSchema),
  v.nullable(StatsRowSchema),
  v.nullable(StatsRowSchema),

  v.nullable(StatsRowSchema),
  v.nullable(StatsRowSchema),
  v.nullable(StatsRowSchema),
  v.nullable(StatsRowSchema),
]);

/**
 * MutationMult:
 *   0:  Health
 *   1:  Stamina
 *   2:  Torpidity
 *   3:  Oxygen
 *
 *   4:  Food
 *   5:  Water
 *   6:  Temperature
 *   7:  Weight
 *
 *   8:  MeleeDamageMultiplier
 *   9:  SpeedMultiplier
 *   10: TemperatureFortitude
 *   11: CraftingSpeedMultiplier
 */
export type MutationMult = v.InferOutput<typeof MutationMultSchema>;
export type MutationMultIn = v.InferInput<typeof MutationMultSchema>;
export const MutationMultSchema = v.tuple([
  v.number(),
  v.number(),
  v.number(),
  v.number(),

  v.number(),
  v.number(),
  v.number(),
  v.number(),

  v.number(),
  v.number(),
  v.number(),
  v.number(),
]);

export type StatImprintMult = v.InferOutput<typeof StatImprintMultSchema>;
export type StatImprintMultIn = v.InferInput<typeof StatImprintMultSchema>;
export const StatImprintMultSchema = v.tuple([
  v.number(),
  v.number(),
  v.number(),
  v.number(),

  v.number(),
  v.number(),
  v.number(),
  v.number(),

  v.number(),
  v.number(),
  v.number(),
  v.number(),
]);

export type ValueSpecies = v.InferOutput<typeof ValueSpeciesSchema>;
export type ValueSpeciesIn = v.InferInput<typeof ValueSpeciesSchema>;
export const ValueSpeciesSchema = v.pipe(
  v.object({
    name: v.nullish(v.string()),
    blueprintPath: v.string(),
    variants: v.nullish(v.array(v.string())),
    fullStatsRaw: v.nullish(FullStatsRawSchema),
    statImprintMult: v.nullish(StatImprintMultSchema),
    mutationMult: v.nullish(MutationMultSchema),
    TamedBaseHealthMultiplier: v.nullish(v.number()),
  }),
);
