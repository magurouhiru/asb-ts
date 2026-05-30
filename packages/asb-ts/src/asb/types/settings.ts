import * as v from "valibot";
import { ModNameSchema } from "../migration/values/index.js";
import {
  VARIANT_DEFAULT_UNSELECTED,
  VariantSchema,
} from "../migration/variants/index.js";

export type StatMultiplierItem = v.InferOutput<typeof StatMultiplierItemSchema>;
export type StatMultiplierItemIn = v.InferInput<
  typeof StatMultiplierItemSchema
>;
export const StatMultiplierItemSchema = v.object({
  TaM: v.number(),
  TmM: v.number(),
  IdM: v.number(),
  IwM: v.number(),
});

export type StatMultiplier = v.InferOutput<typeof StatMultiplierSchema>;
export type StatMultiplierIn = v.InferInput<typeof StatMultiplierSchema>;
export const StatMultiplierSchema = v.object({
  health: StatMultiplierItemSchema,
  stamina: StatMultiplierItemSchema,
  oxygen: StatMultiplierItemSchema,
  food: StatMultiplierItemSchema,
  water: StatMultiplierItemSchema,
  temperature: StatMultiplierItemSchema,
  weight: StatMultiplierItemSchema,
  meleeDamageMultiplier: StatMultiplierItemSchema,
  speedMultiplier: StatMultiplierItemSchema,
  temperatureFortitude: StatMultiplierItemSchema,
  craftingSpeedMultiplier: StatMultiplierItemSchema,
  torpidity: StatMultiplierItemSchema,
});

export type Lang = (typeof Langs)[number];
export const Langs = ["ja"] as const;

export type Settings = v.InferOutput<typeof SettingsSchema>;
export type SettingsIn = v.InferInput<typeof SettingsSchema>;
export const SettingsSchema = v.object({
  statMultipliers: StatMultiplierSchema,
  IBM: v.number(),
  variants: v.array(VariantSchema),
  variantsUnselected: v.array(VariantSchema),
  mods: v.array(ModNameSchema),
  lang: v.picklist(Langs),
});

export const DefaultSettings: Settings = {
  statMultipliers: {
    health: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    stamina: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    oxygen: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    food: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    water: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    temperature: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    weight: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    meleeDamageMultiplier: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    speedMultiplier: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    temperatureFortitude: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    craftingSpeedMultiplier: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    torpidity: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
  },
  IBM: 1,
  variants: [],
  variantsUnselected: VARIANT_DEFAULT_UNSELECTED,
  mods: ["ASA"],
  lang: "ja",
};
