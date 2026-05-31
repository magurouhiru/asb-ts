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

export type StatImprintMultipliers = v.InferOutput<
  typeof StatImprintMultipliersSchema
>;
export type StatImprintMultipliersIn = v.InferInput<
  typeof StatImprintMultipliersSchema
>;
export const StatImprintMultipliersSchema = v.object({
  health: v.number(),
  stamina: v.number(),
  oxygen: v.number(),
  food: v.number(),
  water: v.number(),
  temperature: v.number(),
  weight: v.number(),
  meleeDamageMultiplier: v.number(),
  speedMultiplier: v.number(),
  temperatureFortitude: v.number(),
  craftingSpeedMultiplier: v.number(),
  torpidity: v.number(),
});

export type Lang = (typeof Langs)[number];
export const Langs = ["ja"] as const;

export type Settings = v.InferOutput<typeof SettingsSchema>;
export type SettingsIn = v.InferInput<typeof SettingsSchema>;
export const SettingsSchema = v.object({
  statMultipliers: StatMultiplierSchema,
  StatImprintMultipliers: StatImprintMultipliersSchema,
  IBM: v.number(),
  variants: v.array(VariantSchema),
  variantsUnselected: v.array(VariantSchema),
  mods: v.array(ModNameSchema),
  lang: v.picklist(Langs),
});

// asbのデフォルト
export const DefaultSettings: Settings = {
  statMultipliers: {
    health: { TaM: 0.14, TmM: 0.44, IdM: 0.2, IwM: 1 },
    stamina: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    oxygen: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    food: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    water: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    temperature: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    weight: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    meleeDamageMultiplier: { TaM: 0.14, TmM: 0.44, IdM: 0.17, IwM: 1 },
    speedMultiplier: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    temperatureFortitude: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    craftingSpeedMultiplier: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
    torpidity: { TaM: 1, TmM: 1, IdM: 1, IwM: 1 },
  },
  StatImprintMultipliers: {
    health: 0.2,
    stamina: 0,
    oxygen: 0.2,
    food: 0,
    water: 0.2,
    temperature: 0.2,
    weight: 0,
    meleeDamageMultiplier: 0.2,
    speedMultiplier: 0.2,
    temperatureFortitude: 0.2,
    craftingSpeedMultiplier: 0,
    torpidity: 0,
  },
  IBM: 1,
  variants: [],
  variantsUnselected: VARIANT_DEFAULT_UNSELECTED,
  mods: ["ASA"],
  lang: "ja",
};
