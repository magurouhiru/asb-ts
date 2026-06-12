import * as v from "valibot";
import { describe, expect, it } from "vitest";
import {
  CalculateValueInputPackSchema,
  type LevelDetail,
  type Type,
} from "./calculator.js";
import { DEFAULT_SETTINGS } from "./settings.js";
import { type StatsName, StatsNames } from "./stats-name.js";

const safeLD = { wild: 0, mut: 0, dom: 0 } satisfies LevelDetail;
const safeSpecies = {
  name: "aaa",
  blueprintPath: "bbb",
  variants: [],
  mod: null,
  stats: {
    health: null,
    stamina: null,
    oxygen: null,
    food: null,

    water: null,
    temperature: null,
    weight: null,
    meleeDamageMultiplier: null,

    speedMultiplier: null,
    temperatureFortitude: null,
    craftingSpeedMultiplier: null,
    torpidity: null,
  },
};

describe("CalculateValueInputPackSchema", () => {
  it("CalculateValueInputPackSchema - オブジェクトでない", () => {
    const r = v.safeParse(CalculateValueInputPackSchema, null);
    if (r.success) expect.fail();
    const f = v.flatten(r.issues);
    expect(f.root?.length).toBe(1);
    expect(f.root?.[0]).toBe("Invalid type: Expected Object but received null");

    expect(f.nested).toBe(undefined);

    expect(f.other).toBe(undefined);
  });

  it("CalculateValueInputPackSchema - 空のオブジェクト", () => {
    const r = v.safeParse(CalculateValueInputPackSchema, {});
    if (r.success) expect.fail();
    const f = v.flatten(r.issues);
    expect(f.root).toBe(undefined);

    if (!f.nested) expect.fail();
    expect(Object.entries(f.nested)).toStrictEqual([
      [
        "type",
        [
          'Invalid type: Expected ("wild" | "dom" | "bred") but received undefined',
        ],
      ],
    ]);

    expect(f.other).toBe(undefined);
  });

  it.each([
    [
      {
        name: "typeが不正",
        input: {
          type: "変な文字列" as Type,
          levelsCallback: (sn: StatsName) =>
            sn === "health" ? [sn, { wild: -1, mut: 0, dom: 0 }] : [sn, safeLD],
          tameEffectiveness: 1,
          imprinting: 1,
          species: safeSpecies,
          settings: DEFAULT_SETTINGS,
        },
      },
      [
        "type",
        'Invalid type: Expected ("wild" | "dom" | "bred") but received "変な文字列"',
      ],
    ],
    [
      {
        name: "levels.healthにnumber以外",
        input: {
          type: "wild",
          levelsCallback: (sn: StatsName) =>
            sn === "health"
              ? [sn, { wild: "adf", mut: 0, dom: 0 } as unknown]
              : [sn, safeLD],
          tameEffectiveness: 1,
          imprinting: 1,
          species: safeSpecies,
          settings: DEFAULT_SETTINGS,
        },
      },
      [
        "levels.health.wild",
        'Invalid type: Expected number but received "adf"',
      ],
    ],
    [
      {
        name: "levels.health.wildにnumber以外",
        input: {
          type: "wild",
          levelsCallback: (sn: StatsName) =>
            sn === "health"
              ? [sn, { wild: "adf", mut: 0, dom: 0 } as unknown as LevelDetail]
              : [sn, safeLD],
          tameEffectiveness: 1,
          imprinting: 1,
          species: safeSpecies,
          settings: DEFAULT_SETTINGS,
        },
      },
      [
        "levels.health.wild",
        'Invalid type: Expected number but received "adf"',
      ],
    ],
    [
      {
        name: "levels.staminaにObject以外",
        input: {
          type: "wild",
          levelsCallback: (sn: StatsName) =>
            sn === "stamina" ? [sn, 0 as unknown as LevelDetail] : [sn, safeLD],
          tameEffectiveness: 1,
          imprinting: 1,
          species: safeSpecies,
          settings: DEFAULT_SETTINGS,
        },
      },
      ["levels.stamina", "Invalid type: Expected Object but received 0"],
    ],
  ] satisfies [
    {
      name: string;
      input: {
        type: Type;
        levelsCallback: (sn: StatsName) => [StatsName, unknown];
        tameEffectiveness: number;
        imprinting: number;
        species: unknown;
        settings: unknown;
      };
    },
    [string, string],
  ][])("CalculateValueInputPackSchema - $name", ({ input }, expected) => {
    const r = v.safeParse(CalculateValueInputPackSchema, {
      type: input.type,
      levels: Object.fromEntries(StatsNames.map(input.levelsCallback)),
      tameEffectiveness: input.tameEffectiveness,
      imprinting: input.imprinting,
      species: input.species,
      settings: input.settings,
    });
    if (r.success) expect.fail();
    const f = v.flatten(r.issues);
    expect(f.root).toBe(undefined);

    if (!f.nested) expect.fail();
    expect(Object.entries(f.nested)).toStrictEqual([
      [expected[0], [expected[1]]],
    ]);

    expect(f.other).toBe(undefined);
  });
});
