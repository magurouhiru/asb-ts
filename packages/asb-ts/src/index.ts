import * as v from "valibot";
import { calculateLevelController } from "./asb/calculator.js";
import {
  ImprintingSchema,
  type Levels,
  type TameEffectiveness,
  type ValuesIn,
  ValuesSchema,
} from "./asb/types/io.js";
import type { Species } from "./asb/types/species.js";

export * from "./asb/calculator.js";
export * from "./asb/migration/name-dict/index.js";
export * from "./asb/migration/variants/index.js";
export * from "./asb/species.js";
export * from "./asb/types/index.js";

export function calcL(
  speciesList: Species[],
  values: {
    type: "wild" | "dom" | "bred";
    imprinting: number;
    bp: string;
    health: number;
    stamina: number;
    oxygen: number;
    food: number;
    weight: number;
    meleeDamageMultiplier: number;
    torpidity: number;
  },
): {
  species: Species;
  levels: Levels;
  tameEffectiveness: TameEffectiveness;
} | null {
  const s = speciesList.find((s) => s.blueprintPath === values.bp);
  if (!s) return null;
  const valuesParsed = v.safeParse(ValuesSchema, {
    health: values.health,
    stamina: values.stamina,
    oxygen: values.oxygen,
    food: values.food,
    water: 0,
    temperature: 0,
    weight: values.weight,
    meleeDamageMultiplier: values.meleeDamageMultiplier,
    speedMultiplier: 0,
    temperatureFortitude: 0,
    craftingSpeedMultiplier: 0,
    torpidity: values.torpidity,
  } satisfies ValuesIn);
  const imprintingParsed = v.safeParse(ImprintingSchema, values.imprinting);
  if (!valuesParsed.success || !imprintingParsed.success) return null;
  const [levels, tameEffectiveness] = calculateLevelController(
    s,
    valuesParsed.output,
    imprintingParsed.output,
    values.type,
  );
  return { species: s, levels, tameEffectiveness };
}
