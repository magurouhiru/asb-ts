import { describe, expect, it } from "vitest";
import {
  calculateLevel,
  createSettings,
  createSpeciesList,
  DEFAULT_SETTINGS,
  searchBP,
  type Type,
} from "./index.js";

describe("calculateLevel", () => {
  it.each([
    [
      {
        type: "wild" as Type,
        imprinting: 0,
        name: "ハキリノサウルス",
        health: 825.0,
        stamina: 300.0,
        oxygen: 225.0,
        food: 6300.0,
        weight: 445.3,
        meleeDamageMultiplier: 1.3,
        torpidity: 985.0,
      },
      [6, 10, 5, 11, 11, 6, 49, [], "ASA"],
    ],
    [
      {
        type: "wild" as Type,
        imprinting: 0,
        name: "カブロスクス",
        health: 1000.0,
        stamina: 840.0,
        oxygen: 0,
        food: 2640.0,
        weight: 184.8,
        meleeDamageMultiplier: 1.85,
        torpidity: 1148.0,
      },
      [20, 14, 0, 12, 16, 17, 79, [], "ASA"],
    ],
    [
      {
        type: "wild" as Type,
        imprinting: 0,
        name: "ティラノサウルス",
        health: 5720.0,
        stamina: 1554.0,
        oxygen: 555.0,
        food: 7200.0,
        weight: 750.0,
        meleeDamageMultiplier: 2.5,
        torpidity: 14942.0,
      },
      [21, 27, 27, 14, 25, 30, 144, [], "ASA"],
    ],
    [
      {
        type: "wild" as Type,
        imprinting: 0,
        name: "マナガルム",
        health: 2310.0,
        stamina: 480.0,
        oxygen: 270.0,
        food: 3800.0,
        weight: 348.0,
        meleeDamageMultiplier: 1.45,
        torpidity: 3152.0,
      },
      [9, 6, 8, 9, 8, 9, 49, ["Extinction"], "ASA"],
    ],
    [
      {
        type: "wild" as Type,
        imprinting: 0,
        name: "雪フクロウ",
        health: 2015.0,
        stamina: 1225.0,
        oxygen: 510.0,
        food: 6200.0,
        weight: 562.5,
        meleeDamageMultiplier: 1.9,
        torpidity: 5604.0,
      },
      [26, 25, 24, 21, 25, 18, 139, ["Extinction"], "ASA"],
    ],
    [
      {
        type: "bred" as Type,
        imprinting: 0,
        name: "5ひ79%28下ルキガノトサウルス",
        health: 18840,
        stamina: 409.8,
        oxygen: 169.9,
        food: 4440,
        weight: 1001,
        meleeDamageMultiplier: 2.35,
        torpidity: 176800,
      },
      [46, 49, 53, 44, 43, 43, 278, [], "ASA"],
    ],
    [
      {
        type: "dom" as Type,
        imprinting: Math.random(), // dom であればインプリントは関係ないはず
        name: "ベロナサウルス",
        health: 2024.1,
        stamina: 1267.0,
        oxygen: 742.5,
        food: 5175.0,
        weight: 461.5,
        meleeDamageMultiplier: 2.552,
        torpidity: 3424.5,
      },
      [18, 29, 23, 13, 21, 22, 126, ["Extinction"], "ASA", 1],
    ],
    [
      {
        type: "dom" as Type,
        imprinting: Math.random(), // dom であればインプリントは関係ないはず
        name: "541539(ユウティラヌス)",
        health: 10120.1,
        stamina: 2058.0,
        oxygen: 570.0,
        food: 15300.0,
        weight: 800.0,
        meleeDamageMultiplier: 3.434,
        torpidity: 21638.5,
      },
      [41, 39, 28, 41, 30, 37, 216, [], "ASA", 1],
    ],
    [
      {
        type: "bred" as Type,
        imprinting: 0,
        name: "イノパハデイノスクス)",
        health: 11800.1,
        stamina: 1740.0,
        oxygen: 0.0,
        food: 18300.0,
        weight: 1284.0,
        meleeDamageMultiplier: 4.14,
        torpidity: 22329.5,
      },
      [54, 48, 0, 51, 57, 49, 259, [], "ASA", 1],
    ],
    [
      {
        type: "bred" as Type,
        imprinting: 1,
        name: "{9ルカロドントサウルス",
        health: 31948.8,
        stamina: 598.1,
        oxygen: 160.9,
        food: 5268.0,
        weight: 1310.4,
        meleeDamageMultiplier: 2.5,
        torpidity: 96624.0,
      },
      [29, 41, 29, 39, 34, 35, 207, [], "ASA", 1],
    ],
    [
      {
        type: "bred" as Type,
        imprinting: 1,
        name: "山りばは(カマキリ)",
        health: 2838.1,
        stamina: 975.0,
        oxygen: 690.0,
        food: 5616.0,
        weight: 491.0,
        meleeDamageMultiplier: 3.222,
        torpidity: 7048.1,
      },
      [38, 55, 36, 42, 43, 49, 263, ["ScorchedEarth"], "ASA", 1],
    ],
    [
      {
        type: "bred" as Type,
        imprinting: 0,
        name: "ギカントラブトル",
        health: 5082.1,
        stamina: 1925.0,
        oxygen: 450.0,
        food: 14490.0,
        weight: 595.2,
        meleeDamageMultiplier: 3.904,
        torpidity: 13091.5,
      },
      [28, 45, 20, 32, 43, 45, 213, [], "ASA", 1],
    ],
    [
      {
        type: "dom" as Type,
        imprinting: Math.random(), // dom であればインプリントは関係ないはず
        name: "69り44川47(アロサウルス)",
        health: 4536.1,
        stamina: 1500.0,
        oxygen: 645.0,
        food: 18630.0,
        weight: 630.8,
        meleeDamageMultiplier: 4.022,
        torpidity: 15280.5,
      },
      [31, 50, 33, 44, 33, 47, 238, [], "ASA", 1],
    ],
  ])("calculateLevel - $type:$name", (inputs, expected) => {
    // 想定する使用方法
    // 1. 設定を作る or LocalStorage みたいなとこから読み込む
    const settings = createSettings();

    // 2. 設定をもとに対象となる生物のリストを作る
    const speciesList = createSpeciesList(settings);

    // 3. 各種値を設定する
    // 3.a. Select のような一覧から1つを選択するUIを使う場合: bpをkeyにして、名前とかを表示し、選択されたbpを設定する
    // 3.b. 名前から検索する場合: searchBP を使ってbpを検索して設定する
    const bp = searchBP(speciesList, inputs.name, settings);

    // 4. calculateLevel にぶち込む
    const [levels, tameEffectiveness] = calculateLevel({
      bp,
      type: inputs.type,
      h_v: inputs.health,
      s_v: inputs.stamina,
      o_v: inputs.oxygen,
      f_v: inputs.food,
      w_v: inputs.weight,
      m_v: inputs.meleeDamageMultiplier,
      t_v: inputs.torpidity,
      imp: inputs.imprinting,
      speciesList: speciesList,
      settings,
    });

    expect(levels.health.wild).toBe(expected[0]);
    expect(levels.stamina.wild).toBe(expected[1]);
    expect(levels.oxygen.wild).toBe(expected[2]);
    expect(levels.food.wild).toBe(expected[3]);
    expect(levels.weight.wild).toBe(expected[4]);
    expect(levels.meleeDamageMultiplier.wild).toBe(expected[5]);
    expect(levels.torpidity.wild).toBe(expected[6]);

    // 野生のときはエラーがないはず
    if (inputs.type === "wild") {
      expect(levels.health.error).toBe(null);
      expect(levels.stamina.error).toBe(null);
      expect(levels.oxygen.error).toBe(null);
      expect(levels.food.error).toBe(null);
      expect(levels.weight.error).toBe(null);
      expect(levels.meleeDamageMultiplier.error).toBe(null);
      expect(levels.torpidity.error).toBe(null);
    }

    const species = speciesList.find((s) => s.blueprintPath === bp);
    if (!species) throw new Error("生物が見つからなんだ");

    expect(species.variants).toStrictEqual(expected[7]);
    expect(species.mod).toBe(expected[8]);

    if (inputs.type === "dom") {
      expect(tameEffectiveness).toBe(expected[9]);
    }
  });
});

describe("createSettings", () => {
  it("引数なしでデフォルト値が返る", () => {
    const settings = createSettings();
    expect(settings).toStrictEqual(DEFAULT_SETTINGS);
  });
});
