import { describe, expect, it } from "bun:test";
import * as R from "remeda";
import { searchSpecies } from "../asb/species.js";
import {
  type CalculateLevelInputPackUnsafe,
  calculateLevel,
  createSettings,
  createSpeciesList,
  DEFAULT_SETTINGS,
  extractTexts,
  OcrQueueManager,
  type StatLevelsUnsafe,
  type StatsType,
  type StatValuesUnsafe,
} from "../bun.js";

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
  img?: string;
}[] = [
  {
    name: "ハキリノサウルス",
    type: "wild",
    values: {
      health: 825.0,
      stamina: 300.0,
      oxygen: 225.0,
      food: 6300.0,
      weight: 445.3,
      meleeDamageMultiplier: 1.3,
      torpidity: 985.0,
    },
    withDom: false,
    totalLevel: 0,
    imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
    levels: {
      health: { wild: 6, mut: 0, dom: 0 },
      stamina: { wild: 10, mut: 0, dom: 0 },
      oxygen: { wild: 5, mut: 0, dom: 0 },
      food: { wild: 11, mut: 0, dom: 0 },
      weight: { wild: 11, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 6, mut: 0, dom: 0 },
      torpidity: { wild: 49, mut: 0, dom: 0 },
    },
  },
  {
    name: "カブロスクス",
    type: "wild",
    values: {
      health: 1000.0,
      stamina: 840.0,
      oxygen: 0,
      food: 2640.0,
      weight: 184.8,
      meleeDamageMultiplier: 1.85,
      torpidity: 1148.0,
    },
    withDom: false,
    totalLevel: 0,
    imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
    levels: {
      health: { wild: 20, mut: 0, dom: 0 },
      stamina: { wild: 14, mut: 0, dom: 0 },
      oxygen: undefined,
      food: { wild: 12, mut: 0, dom: 0 },
      weight: { wild: 16, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 17, mut: 0, dom: 0 },
      torpidity: { wild: 79, mut: 0, dom: 0 },
    },
  },
  {
    name: "ティラノサウルス",
    type: "wild",
    values: {
      health: 5720.0,
      stamina: 1554.0,
      oxygen: 555.0,
      food: 7200.0,
      weight: 750.0,
      meleeDamageMultiplier: 2.5,
      torpidity: 14942.0,
    },
    withDom: false,
    totalLevel: 0,
    imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
    levels: {
      health: { wild: 21, mut: 0, dom: 0 },
      stamina: { wild: 27, mut: 0, dom: 0 },
      oxygen: { wild: 27, mut: 0, dom: 0 },
      food: { wild: 14, mut: 0, dom: 0 },
      weight: { wild: 25, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 30, mut: 0, dom: 0 },
      torpidity: { wild: 144, mut: 0, dom: 0 },
    },
    img: "001.png",
  },
  {
    name: "マナガルム",
    type: "wild",
    values: {
      health: 2310.0,
      stamina: 480.0,
      oxygen: 270.0,
      food: 3800.0,
      weight: 348.0,
      meleeDamageMultiplier: 1.45,
      torpidity: 3152.0,
    },
    withDom: false,
    totalLevel: 0,
    imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
    levels: {
      health: { wild: 9, mut: 0, dom: 0 },
      stamina: { wild: 6, mut: 0, dom: 0 },
      oxygen: { wild: 8, mut: 0, dom: 0 },
      food: { wild: 9, mut: 0, dom: 0 },
      weight: { wild: 8, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 9, mut: 0, dom: 0 },
      torpidity: { wild: 49, mut: 0, dom: 0 },
    },
  },
  {
    name: "雪フクロウ",
    type: "wild",
    values: {
      health: 2015.0,
      stamina: 1225.0,
      oxygen: 510.0,
      food: 6200.0,
      weight: 562.5,
      meleeDamageMultiplier: 1.9,
      torpidity: 5604.0,
    },
    withDom: false,
    totalLevel: 0,
    imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
    levels: {
      health: { wild: 26, mut: 0, dom: 0 },
      stamina: { wild: 25, mut: 0, dom: 0 },
      oxygen: { wild: 24, mut: 0, dom: 0 },
      food: { wild: 21, mut: 0, dom: 0 },
      weight: { wild: 25, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 18, mut: 0, dom: 0 },
      torpidity: { wild: 139, mut: 0, dom: 0 },
    },
  },
  {
    name: "5ひ79%28下ルキガノトサウルス",
    type: "bred",
    values: {
      health: 18840,
      stamina: 409.8,
      oxygen: 169.9,
      food: 4440,
      weight: 1001,
      meleeDamageMultiplier: 2.35,
      torpidity: 176800,
    },
    withDom: false,
    totalLevel: 0,
    imprinting: 0,
    levels: {
      health: { wild: 46, mut: 0, dom: 0 },
      stamina: { wild: 49, mut: 0, dom: 0 },
      oxygen: { wild: 53, mut: 0, dom: 0 },
      food: { wild: 44, mut: 0, dom: 0 },
      weight: { wild: 43, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 43, mut: 0, dom: 0 },
      torpidity: { wild: 278, mut: 0, dom: 0 },
    },
  },
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
  {
    name: "541539(ユウティラヌス)",
    type: "dom",
    values: {
      health: 10120.1,
      stamina: 2058.0,
      oxygen: 570.0,
      food: 15300.0,
      weight: 800.0,
      meleeDamageMultiplier: 3.434,
      torpidity: 21638.5,
    },
    withDom: false,
    totalLevel: 217,
    imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
    levels: {
      health: { wild: 41, mut: 0, dom: 0 },
      stamina: { wild: 39, mut: 0, dom: 0 },
      oxygen: { wild: 28, mut: 0, dom: 0 },
      food: { wild: 41, mut: 0, dom: 0 },
      weight: { wild: 30, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 37, mut: 0, dom: 0 },
      torpidity: { wild: 216, mut: 0, dom: 0 },
    },
  },
  {
    name: "イノパハデイノスクス)",
    type: "bred",
    values: {
      health: 11800.1,
      stamina: 1740.0,
      oxygen: 0.0,
      food: 18300.0,
      weight: 1284.0,
      meleeDamageMultiplier: 4.14,
      torpidity: 22329.5,
    },
    withDom: false,
    totalLevel: 260,
    imprinting: 0,
    levels: {
      health: { wild: 54, mut: 0, dom: 0 },
      stamina: { wild: 48, mut: 0, dom: 0 },
      oxygen: undefined,
      food: { wild: 51, mut: 0, dom: 0 },
      weight: { wild: 57, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 49, mut: 0, dom: 0 },
      torpidity: { wild: 259, mut: 0, dom: 0 },
    },
  },
  {
    name: "{9ルカロドントサウルス",
    type: "bred",
    values: {
      health: 31948.8,
      stamina: 598.1,
      oxygen: 160.9,
      food: 5268.0,
      weight: 1310.4,
      meleeDamageMultiplier: 2.5,
      torpidity: 96624.0,
    },
    withDom: false,
    totalLevel: 208,
    imprinting: 1,
    levels: {
      health: { wild: 29, mut: 0, dom: 0 },
      stamina: { wild: 41, mut: 0, dom: 0 },
      oxygen: { wild: 29, mut: 0, dom: 0 },
      food: { wild: 39, mut: 0, dom: 0 },
      weight: { wild: 34, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 35, mut: 0, dom: 0 },
      torpidity: { wild: 207, mut: 0, dom: 0 },
    },
  },
  {
    name: "山りばは(カマキリ)",
    type: "bred",
    values: {
      health: 2838.1,
      stamina: 975.0,
      oxygen: 690.0,
      food: 5616.0,
      weight: 491.0,
      meleeDamageMultiplier: 3.222,
      torpidity: 7048.1,
    },
    withDom: false,
    totalLevel: 264,
    imprinting: 1,
    levels: {
      health: { wild: 38, mut: 0, dom: 0 },
      stamina: { wild: 55, mut: 0, dom: 0 },
      oxygen: { wild: 36, mut: 0, dom: 0 },
      food: { wild: 42, mut: 0, dom: 0 },
      weight: { wild: 43, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 49, mut: 0, dom: 0 },
      torpidity: { wild: 263, mut: 0, dom: 0 },
    },
  },
  {
    name: "ギカントラブトル",
    type: "bred",
    values: {
      health: 5082.1,
      stamina: 1925.0,
      oxygen: 450.0,
      food: 14490.0,
      weight: 595.2,
      meleeDamageMultiplier: 3.904,
      torpidity: 13091.5,
    },
    withDom: false,
    totalLevel: 214,
    imprinting: 0,
    levels: {
      health: { wild: 28, mut: 0, dom: 0 },
      stamina: { wild: 45, mut: 0, dom: 0 },
      oxygen: { wild: 20, mut: 0, dom: 0 },
      food: { wild: 32, mut: 0, dom: 0 },
      weight: { wild: 43, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 45, mut: 0, dom: 0 },
      torpidity: { wild: 213, mut: 0, dom: 0 },
    },
  },
  {
    name: "69り44川47(アロサウルス)",
    type: "dom",
    values: {
      health: 4536.1,
      stamina: 1500.0,
      oxygen: 645.0,
      food: 18630.0,
      weight: 630.8,
      meleeDamageMultiplier: 4.022,
      torpidity: 15280.5,
    },
    withDom: false,
    totalLevel: 239,
    imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
    levels: {
      health: { wild: 31, mut: 0, dom: 0 },
      stamina: { wild: 50, mut: 0, dom: 0 },
      oxygen: { wild: 33, mut: 0, dom: 0 },
      food: { wild: 44, mut: 0, dom: 0 },
      weight: { wild: 33, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 47, mut: 0, dom: 0 },
      torpidity: { wild: 238, mut: 0, dom: 0 },
    },
  },
  {
    name: "ギガノトサウルス",
    type: "bred",
    values: {
      health: 35208.0,
      stamina: 409.8,
      oxygen: 169.9,
      food: 5328.0,
      weight: 1201.2,
      meleeDamageMultiplier: 4.424,
      torpidity: 212160.0,
    },
    withDom: true,
    totalLevel: 336,
    imprinting: 1,
    levels: {
      health: { wild: 46, mut: 0, dom: 0 },
      stamina: { wild: 49, mut: 0, dom: 0 },
      oxygen: { wild: 53, mut: 0, dom: 0 },
      food: { wild: 44, mut: 0, dom: 0 },
      weight: { wild: 43, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 43, mut: 0, dom: 57 },
      torpidity: { wild: 278, mut: 0, dom: 0 },
    },
  },
  {
    name: "せり田山隊長(カマキリ)",
    type: "bred",
    values: {
      health: 5060.0,
      // health: 5060.3,
      stamina: 975.0,
      oxygen: 720.0,
      food: 5616.0,
      weight: 491.0,
      meleeDamageMultiplier: 4.208,
      torpidity: 7098.5,
    },
    withDom: true,
    totalLevel: 313,
    imprinting: 1.0,
    levels: {
      health: { wild: 38, mut: 0, dom: 29 },
      stamina: { wild: 55, mut: 0, dom: 0 },
      oxygen: { wild: 38, mut: 0, dom: 0 },
      food: { wild: 42, mut: 0, dom: 0 },
      weight: { wild: 43, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 49, mut: 0, dom: 18 },
      torpidity: { wild: 265, mut: 0, dom: 0 },
    },
  },
  {
    name: "ポイズンワイバーン",
    type: "bred",
    values: {
      health: 8694.4,
      stamina: 2701.1,
      oxygen: 570.0,
      food: 8640.0,
      weight: 758.4,
      meleeDamageMultiplier: 2.811,
      torpidity: 9953.3,
    },
    withDom: true,
    totalLevel: 225,
    imprinting: 1.0,
    levels: {
      health: { wild: 34, mut: 0, dom: 0 },
      stamina: { wild: 29, mut: 0, dom: 50 },
      oxygen: { wild: 28, mut: 0, dom: 0 },
      food: { wild: 30, mut: 0, dom: 0 },
      weight: { wild: 29, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 24, mut: 0, dom: 0 },
      torpidity: { wild: 174, mut: 0, dom: 0 },
    },
  },
  {
    name: "ンリング・ドレイクリン",
    type: "dom",
    values: {
      health: 1110.1,
      stamina: 735.0,
      oxygen: 555.0,
      food: 4300.0,
      weight: 109.2,
      meleeDamageMultiplier: 2.904,
      torpidity: 1258.5,
    },
    withDom: false,
    totalLevel: 194,
    imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
    levels: {
      health: { wild: 32, mut: 0, dom: 0 },
      stamina: { wild: 39, mut: 0, dom: 0 },
      oxygen: { wild: 27, mut: 0, dom: 0 },
      food: { wild: 33, mut: 0, dom: 0 },
      weight: { wild: 34, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 28, mut: 0, dom: 0 },
      torpidity: { wild: 193, mut: 0, dom: 0 },
    },
    img: "002.png",
  },
  {
    name: "ステゴサウルス",
    type: "dom",
    values: {
      health: 14251.6,
      stamina: 1500.0,
      oxygen: 585.0,
      food: 28800.0,
      weight: 990.0,
      meleeDamageMultiplier: 3.551,
      torpidity: 7190.5,
    },
    withDom: true,
    totalLevel: 267,
    imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
    levels: {
      health: { wild: 28, mut: 0, dom: 43 },
      stamina: { wild: 40, mut: 0, dom: 0 },
      oxygen: { wild: 29, mut: 0, dom: 0 },
      food: { wild: 38, mut: 0, dom: 0 },
      weight: { wild: 49, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 39, mut: 0, dom: 0 },
      torpidity: { wild: 223, mut: 0, dom: 0 },
    },
    img: "003.png",
  },
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

describe("extractTexts", () => {
  const dataSetWithImg = DATA_SET.filter((d) => d.img);
  const manager = new OcrQueueManager(undefined, undefined, undefined, 1);

  it.each(dataSetWithImg)("extractTexts - $type - $name", async (data) => {
    const pathPrefix = new URL("./__fixtures__/", import.meta.url).pathname;
    const file = Bun.file(`${pathPrefix}${data.img}`);

    const r = extractTexts(manager, file);
    if (!r.isSuccess) {
      throw new Error(JSON.stringify(r.error));
    }

    const result = await r.result.normalized;
    expect(result.ip.type).toBe(data.type);
    // expect(result.withDom.text).toBe(data.withDom);
    expect(result.ip.imprinting as number).toBe(
      data.type === "bred" ? data.imprinting : 0,
    );
    R.forEachObj(result.ip.values, (v, k) => {
      expect(v).toBe(data.values[k]);
    });
  });
});
