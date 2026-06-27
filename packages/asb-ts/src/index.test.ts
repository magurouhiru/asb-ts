import { describe, expect, it } from "bun:test";
import * as R from "remeda";
import { searchSpecies } from "./asb/species.js";
import {
  type CalculateLevelInputPackUnsafe,
  calculateLevel,
  createSettings,
  createSpeciesList,
  DEFAULT_SETTINGS,
  type StatLevelsUnsafe,
  type StatsType,
  type StatValuesUnsafe,
} from "./index.js";

describe("createSettings", () => {
  it("引数なしでデフォルト値が返る", () => {
    const settings = createSettings();
    expect(settings).toStrictEqual(DEFAULT_SETTINGS);
  });
});

const DATA_SET: {
  name: string;
  type: StatsType;
  values: StatValuesUnsafe;
  withDom: boolean;
  totalLevel: number;
  imprinting: number;
  levels: StatLevelsUnsafe;
}[] = [
  // {
  //   name: "ハキリノサウルス",
  //   type: "wild",
  //   values: {
  //     health: 825.0,
  //     stamina: 300.0,
  //     oxygen: 225.0,
  //     food: 6300.0,
  //     weight: 445.3,
  //     meleeDamageMultiplier: 1.3,
  //     torpidity: 985.0,
  //   },
  //   withDom: false,
  //   totalLevel: 0,
  //   imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
  //   levels: {
  //     health: { wild: 6, mut: 0, dom: 0 },
  //     stamina: { wild: 10, mut: 0, dom: 0 },
  //     oxygen: { wild: 5, mut: 0, dom: 0 },
  //     food: { wild: 11, mut: 0, dom: 0 },
  //     weight: { wild: 11, mut: 0, dom: 0 },
  //     meleeDamageMultiplier: { wild: 6, mut: 0, dom: 0 },
  //     torpidity: { wild: 49, mut: 0, dom: 0 },
  //   },
  // },
  // {
  //   name: "カブロスクス",
  //   type: "wild",
  //   values: {
  //     health: 1000.0,
  //     stamina: 840.0,
  //     oxygen: 0,
  //     food: 2640.0,
  //     weight: 184.8,
  //     meleeDamageMultiplier: 1.85,
  //     torpidity: 1148.0,
  //   },
  //   withDom: false,
  //   totalLevel: 0,
  //   imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
  //   levels: {
  //     health: { wild: 20, mut: 0, dom: 0 },
  //     stamina: { wild: 14, mut: 0, dom: 0 },
  //     food: { wild: 12, mut: 0, dom: 0 },
  //     weight: { wild: 16, mut: 0, dom: 0 },
  //     meleeDamageMultiplier: { wild: 17, mut: 0, dom: 0 },
  //     torpidity: { wild: 79, mut: 0, dom: 0 },
  //   },
  // },
  // {
  //   name: "ティラノサウルス",
  //   type: "wild",
  //   values: {
  //     health: 5720.0,
  //     stamina: 1554.0,
  //     oxygen: 555.0,
  //     food: 7200.0,
  //     weight: 750.0,
  //     meleeDamageMultiplier: 2.5,
  //     torpidity: 14942.0,
  //   },
  //   withDom: false,
  //   totalLevel: 0,
  //   imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
  //   levels: {
  //     health: { wild: 21, mut: 0, dom: 0 },
  //     stamina: { wild: 27, mut: 0, dom: 0 },
  //     oxygen: { wild: 27, mut: 0, dom: 0 },
  //     food: { wild: 14, mut: 0, dom: 0 },
  //     weight: { wild: 25, mut: 0, dom: 0 },
  //     meleeDamageMultiplier: { wild: 30, mut: 0, dom: 0 },
  //     torpidity: { wild: 144, mut: 0, dom: 0 },
  //   },
  // },
  // {
  //   name: "マナガルム",
  //   type: "wild",
  //   values: {
  //     health: 2310.0,
  //     stamina: 480.0,
  //     oxygen: 270.0,
  //     food: 3800.0,
  //     weight: 348.0,
  //     meleeDamageMultiplier: 1.45,
  //     torpidity: 3152.0,
  //   },
  //   withDom: false,
  //   totalLevel: 0,
  //   imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
  //   levels: {
  //     health: { wild: 9, mut: 0, dom: 0 },
  //     stamina: { wild: 6, mut: 0, dom: 0 },
  //     oxygen: { wild: 8, mut: 0, dom: 0 },
  //     food: { wild: 9, mut: 0, dom: 0 },
  //     weight: { wild: 8, mut: 0, dom: 0 },
  //     meleeDamageMultiplier: { wild: 9, mut: 0, dom: 0 },
  //     torpidity: { wild: 49, mut: 0, dom: 0 },
  //   },
  // },
  // {
  //   name: "雪フクロウ",
  //   type: "wild",
  //   values: {
  //     health: 2015.0,
  //     stamina: 1225.0,
  //     oxygen: 510.0,
  //     food: 6200.0,
  //     weight: 562.5,
  //     meleeDamageMultiplier: 1.9,
  //     torpidity: 5604.0,
  //   },
  //   withDom: false,
  //   totalLevel: 0,
  //   imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
  //   levels: {
  //     health: { wild: 26, mut: 0, dom: 0 },
  //     stamina: { wild: 25, mut: 0, dom: 0 },
  //     oxygen: { wild: 24, mut: 0, dom: 0 },
  //     food: { wild: 21, mut: 0, dom: 0 },
  //     weight: { wild: 25, mut: 0, dom: 0 },
  //     meleeDamageMultiplier: { wild: 18, mut: 0, dom: 0 },
  //     torpidity: { wild: 139, mut: 0, dom: 0 },
  //   },
  // },
  // {
  //   name: "5ひ79%28下ルキガノトサウルス",
  //   type: "bred",
  //   values: {
  //     health: 18840,
  //     stamina: 409.8,
  //     oxygen: 169.9,
  //     food: 4440,
  //     weight: 1001,
  //     meleeDamageMultiplier: 2.35,
  //     torpidity: 176800,
  //   },
  //   withDom: false,
  //   totalLevel: 0,
  //   imprinting: 0,
  //   levels: {
  //     health: { wild: 46, mut: 0, dom: 0 },
  //     stamina: { wild: 49, mut: 0, dom: 0 },
  //     oxygen: { wild: 53, mut: 0, dom: 0 },
  //     food: { wild: 44, mut: 0, dom: 0 },
  //     weight: { wild: 43, mut: 0, dom: 0 },
  //     meleeDamageMultiplier: { wild: 43, mut: 0, dom: 0 },
  //     torpidity: { wild: 278, mut: 0, dom: 0 },
  //   },
  // },
  {
    name: "ベロナサウルス",
    type: "dom",
    values: {
      health: 2024.1,
      stamina: 1267.5,
      oxygen: 742.5,
      food: 5175.0,
      weight: 461.5,
      meleeDamageMultiplier: 2.552,
      torpidity: 3424.5,
    },
    withDom: false,
    totalLevel: 127,
    imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
    levels: {
      health: { wild: 18, mut: 0, dom: 0 },
      stamina: { wild: 29, mut: 0, dom: 0 },
      oxygen: { wild: 23, mut: 0, dom: 0 },
      food: { wild: 13, mut: 0, dom: 0 },
      weight: { wild: 21, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 22, mut: 0, dom: 0 },
      torpidity: { wild: 126, mut: 0, dom: 0 },
    },
  },
  // {
  //   name: "",
  //     type: "wild",
  //     values: {
  //     },
  //     withDom: false,
  //     totalLevel: 0,
  // imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
  //   levels: {
  //     health: { wild: , mut: 0, dom: 0 },
  //     stamina: { wild: , mut: 0, dom: 0 },
  //     oxygen: { wild: , mut: 0, dom: 0 },
  //     food: { wild: , mut: 0, dom: 0 },
  //     weight: { wild: , mut: 0, dom: 0 },
  //     meleeDamageMultiplier: { wild: , mut: 0, dom: 0 },
  //     torpidity: { wild: , mut: 0, dom: 0 },
  //   },
  // },
] as const;

describe("calculateLevel", () => {
  it.each(DATA_SET)("calculateLevel - $type - $name", (data) => {
    const settings = createSettings();

    const speciesList = createSpeciesList(settings);

    const species = searchSpecies(speciesList, data.name, settings);

    const result = calculateLevel({
      ...data,
      species,
      settings,
    } as CalculateLevelInputPackUnsafe);

    if (!result.isSuccess) {
      throw new Error(JSON.stringify(result.error));
    }
    const { levels } = result.result;

    R.forEachObj(levels, (v, k) => {
      expect(v?.wild as number | undefined).toBe(data.levels[k]?.wild);
      expect(v?.mut as number | undefined).toBe(data.levels[k]?.mut);
      expect(v?.dom as number | undefined).toBe(data.levels[k]?.dom);
    });
  });
});
