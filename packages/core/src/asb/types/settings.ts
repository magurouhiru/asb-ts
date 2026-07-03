import * as v from "valibot";
import { ModNameSchema } from "../migration/values/index.js";
import {
  VARIANT_DEFAULT_UNSELECTED,
  VariantSchema,
} from "../migration/variants/index.js";
import { STAT_LABELS } from "./stat-name.js";

export type StatMultiplierItem = v.InferOutput<typeof StatMultiplierItemSchema>;
export const StatMultiplierItemSchema = v.object({
  TaM: v.number(),
  TmM: v.number(),
  IdM: v.number(),
  IwM: v.number(),
});

export type StatMultiplier = v.InferOutput<typeof StatMultiplierSchema>;
export const StatMultiplierSchema = v.object(
  v.entriesFromList(STAT_LABELS, StatMultiplierItemSchema),
);

export type Lang = (typeof LANGS)[number];
export const LANGS = ["ja"] as const;

export type Settings = v.InferOutput<typeof SettingsSchema>;
export const SettingsSchema = v.object({
  statMultipliers: StatMultiplierSchema,
  IBM: v.number(),
  variants: v.array(VariantSchema),
  variantsUnselected: v.array(VariantSchema),
  mods: v.array(ModNameSchema),
  lang: v.picklist(LANGS),
});

// asbのデフォルト
export const DEFAULT_SETTINGS: Settings = {
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
  IBM: 1,
  variants: [],
  variantsUnselected: VARIANT_DEFAULT_UNSELECTED,
  mods: ["ASA"],
  lang: "ja",
};
