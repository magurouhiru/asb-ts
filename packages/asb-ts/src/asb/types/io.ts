import * as v from "valibot";
import { PositiveValueSchema } from "./common.js";

/**
 * wild: 野生のレベル
 * dom: 飼育のレベル
 * error: 実際の値と算出した値の誤差
 */
export type LevelDetail = v.InferOutput<typeof LevelDetailSchema>;
export type LevelDetailIn = v.InferInput<typeof LevelDetailSchema>;
export const LevelDetailSchema = v.object({
  wild: v.pipe(PositiveValueSchema, v.brand("LevelDetailSchema/wild")),
  dom: v.nullish(v.pipe(PositiveValueSchema, v.brand("LevelDetailSchema/dom"))),
  error: v.pipe(
    v.nullish(PositiveValueSchema),
    v.brand("LevelDetailSchema/error"),
  ),
});

export type Levels = v.InferOutput<typeof LevelsSchema>;
export type LevelsIn = v.InferInput<typeof LevelsSchema>;
export const LevelsSchema = v.object({
  health: v.pipe(LevelDetailSchema, v.brand("LevelsSchema/health")),
  stamina: v.pipe(LevelDetailSchema, v.brand("LevelsSchema/stamina")),
  oxygen: v.pipe(LevelDetailSchema, v.brand("LevelsSchema/oxygen")),
  food: v.pipe(LevelDetailSchema, v.brand("LevelsSchema/food")),
  water: v.pipe(LevelDetailSchema, v.brand("LevelsSchema/water")),
  temperature: v.pipe(LevelDetailSchema, v.brand("LevelsSchema/temperature")),
  weight: v.pipe(LevelDetailSchema, v.brand("LevelsSchema/weight")),
  meleeDamageMultiplier: v.pipe(
    LevelDetailSchema,
    v.brand("LevelsSchema/meleeDamageMultiplier"),
  ),
  speedMultiplier: v.pipe(
    LevelDetailSchema,
    v.brand("LevelsSchema/speedMultiplier"),
  ),
  temperatureFortitude: v.pipe(
    LevelDetailSchema,
    v.brand("LevelsSchema/temperatureFortitude"),
  ),
  craftingSpeedMultiplier: v.pipe(
    LevelDetailSchema,
    v.brand("LevelsSchema/craftingSpeedMultiplier"),
  ),
  torpidity: v.pipe(LevelDetailSchema, v.brand("LevelsSchema/torpidity")),
});

export type Values = v.InferOutput<typeof ValuesSchema>;
export type ValuesIn = v.InferInput<typeof ValuesSchema>;
export const ValuesSchema = v.object({
  health: v.pipe(PositiveValueSchema, v.brand("ValuesSchema/health")),
  stamina: v.pipe(PositiveValueSchema, v.brand("ValuesSchema/stamina")),
  oxygen: v.pipe(PositiveValueSchema, v.brand("ValuesSchema/oxygen")),
  food: v.pipe(PositiveValueSchema, v.brand("ValuesSchema/food")),
  water: v.pipe(PositiveValueSchema, v.brand("ValuesSchema/water")),
  temperature: v.pipe(PositiveValueSchema, v.brand("ValuesSchema/temperature")),
  weight: v.pipe(PositiveValueSchema, v.brand("ValuesSchema/weight")),
  meleeDamageMultiplier: v.pipe(
    PositiveValueSchema,
    v.brand("ValuesSchema/meleeDamageMultiplier"),
  ),
  speedMultiplier: v.pipe(
    PositiveValueSchema,
    v.brand("ValuesSchema/speedMultiplier"),
  ),
  temperatureFortitude: v.pipe(
    PositiveValueSchema,
    v.brand("ValuesSchema/temperatureFortitude"),
  ),
  craftingSpeedMultiplier: v.pipe(
    PositiveValueSchema,
    v.brand("ValuesSchema/craftingSpeedMultiplier"),
  ),
  torpidity: v.pipe(PositiveValueSchema, v.brand("ValuesSchema/torpidity")),
});

export type Imprinting = v.InferOutput<typeof ImprintingSchema>;
export type ImprintingIn = v.InferInput<typeof ImprintingSchema>;
export const ImprintingSchema = v.pipe(
  PositiveValueSchema,
  v.brand("ImprintingSchema"),
);

export type Type = (typeof types)[number];
export const types = ["wild", "dom", "bred"] as const;
