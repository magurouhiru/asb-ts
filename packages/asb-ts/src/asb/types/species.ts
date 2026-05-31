import * as v from "valibot";
import { ModNameSchema } from "../migration/values/index.js";
import { VariantSchema } from "../migration/variants/index.js";
import { PositiveValueSchema } from "./common.js";

/**
 * packages/asb-ts/ARKStatsExtractor/ARKBreedingStats/species/SpeciesStat.cs
 */
export type SpeciesStat = v.InferOutput<typeof SpeciesStatSchema>;
export type SpeciesStatIn = v.InferInput<typeof SpeciesStatSchema>;
export const SpeciesStatSchema = v.object({
  baseValue: v.pipe(
    PositiveValueSchema,
    v.brand("SpeciesStatSchema/baseValue"),
  ),
  incPerWildLevel: v.pipe(
    PositiveValueSchema,
    v.brand("SpeciesStatSchema/incPerWildLevel"),
  ),
  incPerDomLevel: v.pipe(
    PositiveValueSchema,
    v.brand("SpeciesStatSchema/incPerDomLevel"),
  ),
  additiveBonus: v.pipe(v.number(), v.brand("SpeciesStatSchema/additiveBonus")),
  multiplicativeBonus: v.pipe(
    PositiveValueSchema,
    v.brand("SpeciesStatSchema/multiplicativeBonus"),
  ),
});

/**
 * asb-ts/ARKStatsExtractor/ARKBreedingStats/Ark.cs
 */
export type Stats = v.InferOutput<typeof StatsSchema>;
export type StatsIn = v.InferInput<typeof StatsSchema>;
export const StatsSchema = v.object({
  health: v.pipe(v.nullable(SpeciesStatSchema), v.brand("StatsSchema/health")),
  stamina: v.pipe(
    v.nullable(SpeciesStatSchema),
    v.brand("StatsSchema/stamina"),
  ),
  oxygen: v.pipe(v.nullable(SpeciesStatSchema), v.brand("StatsSchema/oxygen")),
  food: v.pipe(v.nullable(SpeciesStatSchema), v.brand("StatsSchema/food")),
  water: v.pipe(v.nullable(SpeciesStatSchema), v.brand("StatsSchema/water")),
  temperature: v.pipe(
    v.nullable(SpeciesStatSchema),
    v.brand("StatsSchema/temperature"),
  ),
  weight: v.pipe(v.nullable(SpeciesStatSchema), v.brand("StatsSchema/weight")),
  meleeDamageMultiplier: v.pipe(
    v.nullable(SpeciesStatSchema),
    v.brand("StatsSchema/meleeDamageMultiplier"),
  ),
  speedMultiplier: v.pipe(
    v.nullable(SpeciesStatSchema),
    v.brand("StatsSchema/speedMultiplier"),
  ),
  temperatureFortitude: v.pipe(
    v.nullable(SpeciesStatSchema),
    v.brand("StatsSchema/temperatureFortitude"),
  ),
  craftingSpeedMultiplier: v.pipe(
    v.nullable(SpeciesStatSchema),
    v.brand("StatsSchema/craftingSpeedMultiplier"),
  ),
  torpidity: v.pipe(
    v.nullable(SpeciesStatSchema),
    v.brand("StatsSchema/torpidity"),
  ),
});

export type StatImprintMultDetail = v.InferOutput<
  typeof StatImprintMultDetailSchema
>;
export type StatImprintMultDetailIn = v.InferInput<
  typeof StatImprintMultDetailSchema
>;
export const StatImprintMultDetailSchema = v.pipe(
  v.number(),
  v.brand("StatImprintMultDetailSchema"),
);

export type StatImprintMultiplier = v.InferOutput<
  typeof StatImprintMultiplierSchema
>;
export type StatImprintMultiplierIn = v.InferInput<
  typeof StatImprintMultiplierSchema
>;
export const StatImprintMultiplierSchema = v.object({
  health: StatImprintMultDetailSchema,
  stamina: StatImprintMultDetailSchema,
  oxygen: StatImprintMultDetailSchema,
  food: StatImprintMultDetailSchema,

  water: StatImprintMultDetailSchema,
  temperature: StatImprintMultDetailSchema,
  weight: StatImprintMultDetailSchema,
  meleeDamageMultiplier: StatImprintMultDetailSchema,

  speedMultiplier: StatImprintMultDetailSchema,
  temperatureFortitude: StatImprintMultDetailSchema,
  craftingSpeedMultiplier: StatImprintMultDetailSchema,
  torpidity: StatImprintMultDetailSchema,
});

export type BlueprintPath = v.InferOutput<typeof BlueprintPathSchema>;
export type BlueprintPathIn = v.InferInput<typeof BlueprintPathSchema>;
export const BlueprintPathSchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.brand("SpeciesSchema/blueprintPath"),
);

export type TamedBaseHealthMultiplier = v.InferOutput<
  typeof TamedBaseHealthMultiplierSchema
>;
export type TamedBaseHealthMultiplierIn = v.InferInput<
  typeof TamedBaseHealthMultiplierSchema
>;
export const TamedBaseHealthMultiplierSchema = v.pipe(
  v.number(),
  v.brand("SpeciesSchema/TamedBaseHealthMultiplier"),
);

export type Species = v.InferOutput<typeof SpeciesSchema>;
export type SpeciesIn = v.InferInput<typeof SpeciesSchema>;
export const SpeciesSchema = v.object({
  name: v.string(),
  blueprintPath: BlueprintPathSchema,
  variants: v.array(VariantSchema),
  mod: v.nullable(ModNameSchema),
  stats: StatsSchema,
  statImprintMultiplier: v.optional(StatImprintMultiplierSchema),
  tamedBaseHealthMultiplier: v.optional(TamedBaseHealthMultiplierSchema),
});
