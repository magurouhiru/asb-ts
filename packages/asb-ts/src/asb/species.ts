import Fuse from "fuse.js";
import * as v from "valibot";
import { DefaultNameDict, NameDicts } from "./migration/name-dict/index.js";
import {
  AllModSpecies,
  type FullStatsRaw,
  type ModName,
  type MutationMult,
  type StatImprintMult,
  type StatsRow,
} from "./migration/values/index.js";
import type { Variant } from "./migration/variants/index.js";
import { ASBTSErrorCommon } from "./types/error.js";
import {
  type MutationMultiplier,
  MutationMultiplierSchema,
  type Settings,
  type Species,
  SpeciesSchema,
  type SpeciesStat,
  SpeciesStatSchema,
  type Stats,
  type StatsImprintMultiplier,
  StatsImprintMultiplierSchema,
  StatsSchema,
} from "./types/index.js";

// Index of the base value in fullStatsRaw.
const StatsRawIndexBase = 0;

// Index of the increase per wild level value in fullStatsRaw.
const StatsRawIndexIncPerWildLevel = 1;

// Index of the increase per dom level value in fullStatsRaw.
const StatsRawIndexIncPerDomLevel = 2;

// Index of the additive bonus value in fullStatsRaw.
const StatsRawIndexAdditiveBonus = 3;

// Index of the multiplicative bonus value in fullStatsRaw.
const StatsRawIndexMultiplicativeBonus = 4;

export function createSpeciesList(settings: Settings): Species[] {
  const searchTarget = AllModSpecies.filter(
    (ms) => ms.mod === null || settings.mods.includes(ms.mod),
  );
  const tmpMap = new Map<
    string,
    {
      name: string;
      blueprintPath: string;
      variants: Variant[];
      mod: ModName | null;
      stats: FullStatsRaw | null;
      statImprintMults: StatImprintMult | null;
      mutationMult: MutationMult | null;
      tamedBaseHealthMultiplier: number | null;
    }
  >();
  const nameDict =
    NameDicts.find((nd) => nd.lang === settings.lang)?.dict ?? DefaultNameDict;
  searchTarget.forEach((ms) => {
    ms.species.forEach((s) => {
      const value = tmpMap.get(s.blueprintPath);
      if (value) {
        if (s.variants && s.variants.length > 0) value.variants = s.variants;
        value.mod = ms.mod;
        if (s.fullStatsRaw) value.stats = s.fullStatsRaw;
        if (s.statImprintMult) value.statImprintMults = s.statImprintMult;
        if (s.mutationMult) value.mutationMult = s.mutationMult;
        if (s.TamedBaseHealthMultiplier)
          value.tamedBaseHealthMultiplier = s.TamedBaseHealthMultiplier;
      } else {
        const nameEntry = nameDict.find((n) => n.source === s.name);
        if (!nameEntry) return;
        tmpMap.set(s.blueprintPath, {
          name: `${nameEntry.translation}(${nameEntry.source})`,
          blueprintPath: s.blueprintPath,
          variants: s.variants ?? [],
          mod: ms.mod,
          stats: s.fullStatsRaw ?? null,
          statImprintMults: s.statImprintMult ?? null,
          mutationMult: s.mutationMult ?? null,
          tamedBaseHealthMultiplier: s.TamedBaseHealthMultiplier ?? null,
        });
      }
    });
  });
  return Array.from(tmpMap.values())
    .filter(
      (s) => !s.variants.some((v) => settings.variantsUnselected.includes(v)),
    )
    .map((s) => {
      if (s.stats === null) return null;
      const result = v.safeParse(SpeciesSchema, {
        ...s,
        stats: toStats(s.stats),
        statImprintMultiplier: s.statImprintMults
          ? toStatImprintMultiplier(s.statImprintMults)
          : undefined,
        mutationMultiplier: s.mutationMult
          ? toMutationMultiplier(s.mutationMult)
          : undefined,
        tamedBaseHealthMultiplier: s.tamedBaseHealthMultiplier ?? undefined,
      } satisfies v.InferInput<typeof SpeciesSchema>);
      return result.success ? result.output : null;
    })
    .filter((s) => s !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

export function searchSpecies(
  speciesList: Species[],
  name: string,
  settings: Settings,
): Species {
  const fuse = new Fuse(
    speciesList.map((s) => s.name),
    {
      threshold: 1,
    },
  );
  const hit = fuse.search(name).at(0)?.item;
  if (!hit) {
    throw new ASBTSErrorCommon(
      "生物が見つかりませんでした。",
      "searchSpecies",
      { speciesList, name, settings },
    );
  }

  const found = speciesList
    .filter((s) => s.name === hit)
    .sort((a, b) => a.variants.length - b.variants.length)
    .sort((a, b) => {
      const aHasVariant = settings.variants.some((v) => a.variants.includes(v));
      const bHasVariant = settings.variants.some((v) => b.variants.includes(v));
      if (aHasVariant && !bHasVariant) return -1;
      if (!aHasVariant && bHasVariant) return 1;
      return 0;
    });

  const result = found[0];
  if (!result) {
    throw new ASBTSErrorCommon(
      "生物が見つかりませんでした。",
      "searchSpecies",
      { speciesList, name, settings },
    );
  }
  return result;
}

function toStats([
  health,
  stamina,
  torpidity,
  oxygen,

  food,
  water,
  temperature,
  weight,

  meleeDamageMultiplier,
  speedMultiplier,
  temperatureFortitude,
  craftingSpeedMultiplier,
]: FullStatsRaw): Stats {
  return v.parse(StatsSchema, {
    health: toSpeciesStat(health),
    stamina: toSpeciesStat(stamina),
    oxygen: toSpeciesStat(oxygen),
    food: toSpeciesStat(food),

    water: toSpeciesStat(water),
    temperature: toSpeciesStat(temperature),
    weight: toSpeciesStat(weight),
    meleeDamageMultiplier: toSpeciesStat(meleeDamageMultiplier),

    speedMultiplier: toSpeciesStat(speedMultiplier),
    temperatureFortitude: toSpeciesStat(temperatureFortitude),
    craftingSpeedMultiplier: toSpeciesStat(craftingSpeedMultiplier),
    torpidity: toSpeciesStat(torpidity),
  } satisfies v.InferInput<typeof StatsSchema>);
}

function toSpeciesStat(row: StatsRow | null): SpeciesStat | undefined {
  if (!row) return undefined;
  return v.parse(SpeciesStatSchema, {
    baseValue: row[StatsRawIndexBase],
    incPerWildLevel: row[StatsRawIndexIncPerWildLevel],
    incPerDomLevel: row[StatsRawIndexIncPerDomLevel],
    additiveBonus: row[StatsRawIndexAdditiveBonus],
    multiplicativeBonus: row[StatsRawIndexMultiplicativeBonus],
  } satisfies v.InferInput<typeof SpeciesStatSchema>);
}

function toStatImprintMultiplier([
  health,
  stamina,
  torpidity,
  oxygen,

  food,
  water,
  temperature,
  weight,

  meleeDamageMultiplier,
  speedMultiplier,
  temperatureFortitude,
  craftingSpeedMultiplier,
]: StatImprintMult): StatsImprintMultiplier {
  return v.parse(StatsImprintMultiplierSchema, {
    health,
    stamina,
    oxygen,
    food,

    water,
    temperature,
    weight,
    meleeDamageMultiplier,

    speedMultiplier,
    temperatureFortitude,
    craftingSpeedMultiplier,
    torpidity,
  } satisfies v.InferInput<typeof StatsImprintMultiplierSchema>);
}

function toMutationMultiplier([
  health,
  stamina,
  torpidity,
  oxygen,

  food,
  water,
  temperature,
  weight,

  meleeDamageMultiplier,
  speedMultiplier,
  temperatureFortitude,
  craftingSpeedMultiplier,
]: MutationMult): MutationMultiplier {
  return v.parse(MutationMultiplierSchema, {
    health,
    stamina,
    oxygen,
    food,

    water,
    temperature,
    weight,
    meleeDamageMultiplier,

    speedMultiplier,
    temperatureFortitude,
    craftingSpeedMultiplier,
    torpidity,
  } satisfies v.InferInput<typeof MutationMultiplierSchema>);
}
