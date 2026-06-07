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
        imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
        name: "ハキリノサウルス",
        health: 825.0,
        stamina: 300.0,
        oxygen: 225.0,
        food: 6300.0,
        weight: 445.3,
        meleeDamageMultiplier: 1.3,
        torpidity: 985.0,
        totalLevel: 0,
      },
      [6, 10, 5, 11, 11, 6, 49, [], "ASA"],
    ],
    [
      {
        type: "wild" as Type,
        imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
        name: "カブロスクス",
        health: 1000.0,
        stamina: 840.0,
        oxygen: 0,
        food: 2640.0,
        weight: 184.8,
        meleeDamageMultiplier: 1.85,
        torpidity: 1148.0,
        totalLevel: 0,
      },
      [20, 14, 0, 12, 16, 17, 79, [], "ASA"],
    ],
    [
      {
        type: "wild" as Type,
        imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
        name: "ティラノサウルス",
        health: 5720.0,
        stamina: 1554.0,
        oxygen: 555.0,
        food: 7200.0,
        weight: 750.0,
        meleeDamageMultiplier: 2.5,
        torpidity: 14942.0,
        totalLevel: 0,
      },
      [21, 27, 27, 14, 25, 30, 144, [], "ASA"],
    ],
    [
      {
        type: "wild" as Type,
        imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
        name: "マナガルム",
        health: 2310.0,
        stamina: 480.0,
        oxygen: 270.0,
        food: 3800.0,
        weight: 348.0,
        meleeDamageMultiplier: 1.45,
        torpidity: 3152.0,
        totalLevel: 0,
      },
      [9, 6, 8, 9, 8, 9, 49, ["Extinction"], "ASA"],
    ],
    [
      {
        type: "wild" as Type,
        imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
        name: "雪フクロウ",
        health: 2015.0,
        stamina: 1225.0,
        oxygen: 510.0,
        food: 6200.0,
        weight: 562.5,
        meleeDamageMultiplier: 1.9,
        torpidity: 5604.0,
        totalLevel: 0,
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
        totalLevel: 279,
      },
      [46, 49, 53, 44, 43, 43, 278, [], "ASA"],
    ],
    [
      {
        type: "dom" as Type,
        imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
        name: "ベロナサウルス",
        health: 2024.1,
        stamina: 1267.5,
        oxygen: 742.5,
        food: 5175.0,
        weight: 461.5,
        meleeDamageMultiplier: 2.552,
        torpidity: 3424.5,
        totalLevel: 127,
      },
      [18, 29, 23, 13, 21, 22, 126, ["Extinction"], "ASA", 1],
    ],
    [
      {
        type: "dom" as Type,
        imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
        name: "541539(ユウティラヌス)",
        health: 10120.1,
        stamina: 2058.0,
        oxygen: 570.0,
        food: 15300.0,
        weight: 800.0,
        meleeDamageMultiplier: 3.434,
        torpidity: 21638.5,
        totalLevel: 217,
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
        totalLevel: 260,
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
        totalLevel: 208,
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
        totalLevel: 264,
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
        totalLevel: 214,
      },
      [28, 45, 20, 32, 43, 45, 213, [], "ASA", 1],
    ],
    [
      {
        type: "dom" as Type,
        imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
        name: "69り44川47(アロサウルス)",
        health: 4536.1,
        stamina: 1500.0,
        oxygen: 645.0,
        food: 18630.0,
        weight: 630.8,
        meleeDamageMultiplier: 4.022,
        torpidity: 15280.5,
        totalLevel: 239,
      },
      [31, 50, 33, 44, 33, 47, 238, [], "ASA", 1],
    ],
  ])("calculateLevel - wild - $type:$name", (inputs, expected) => {
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
    const result = calculateLevel({
      bp,
      type: inputs.type,
      imprinting: inputs.imprinting,
      speciesList: speciesList,
      settings,
      values: {
        health: inputs.health,
        stamina: inputs.stamina,
        oxygen: inputs.oxygen,
        food: inputs.food,
        weight: inputs.weight,
        meleeDamageMultiplier: inputs.meleeDamageMultiplier,
        torpidity: inputs.torpidity,
        water: 0, // 無視
        temperature: 0, // 無視
        speedMultiplier: 0, // 無視
        temperatureFortitude: 0, // 無視
        craftingSpeedMultiplier: 0, // 無視
      },
      totalLevel: inputs.totalLevel,
      withDom: true,
    });

    // 5. ステータスを確認して対応する処理を行う
    if (result.status === "failure") expect.fail(JSON.stringify(result));
    const { levels, tameEffectiveness, meta } = result;

    const species = speciesList.find((s) => s.blueprintPath === bp);
    if (!species) throw expect.fail("生物が見つからなんだ");

    expect(levels.health.wild).toBe(expected[0]);
    expect(levels.stamina.wild).toBe(expected[1]);
    expect(levels.oxygen.wild).toBe(expected[2]);
    expect(levels.food.wild).toBe(expected[3]);
    expect(levels.weight.wild).toBe(expected[4]);
    expect(levels.meleeDamageMultiplier.wild).toBe(expected[5]);
    expect(levels.torpidity.wild).toBe(expected[6]);

    expect(levels.health.mut).toBe(0);
    expect(levels.stamina.mut).toBe(0);
    expect(levels.oxygen.mut).toBe(0);
    expect(levels.food.mut).toBe(0);
    expect(levels.weight.mut).toBe(0);
    expect(levels.meleeDamageMultiplier.mut).toBe(0);
    expect(levels.torpidity.mut).toBe(0);

    expect(levels.health.dom).toBe(0);
    expect(levels.stamina.dom).toBe(0);
    expect(levels.oxygen.dom).toBe(0);
    expect(levels.food.dom).toBe(0);
    expect(levels.weight.dom).toBe(0);
    expect(levels.meleeDamageMultiplier.dom).toBe(0);
    expect(levels.torpidity.dom).toBe(0);

    // 野生のときはエラーがないはず
    if (inputs.type === "wild") {
      expect(meta.statsMeta.health?.valueDiff).toBe(undefined);
      expect(meta.statsMeta.stamina?.valueDiff).toBe(undefined);
      expect(meta.statsMeta.oxygen?.valueDiff).toBe(undefined);
      expect(meta.statsMeta.food?.valueDiff).toBe(undefined);
      expect(meta.statsMeta.weight?.valueDiff).toBe(undefined);
      expect(meta.statsMeta.meleeDamageMultiplier?.valueDiff).toBe(undefined);
      expect(meta.statsMeta.torpidity?.valueDiff).toBe(undefined);
    }

    expect(species.variants).toStrictEqual(expected[7]);
    expect(species.mod).toBe(expected[8]);

    if (inputs.type === "dom") {
      expect(tameEffectiveness).toBe(expected[9]);
    }
  });

  it.each([
    [
      {
        type: "bred" as Type,
        imprinting: 1,
        name: "ギガノトサウルス",
        health: 35208.0,
        stamina: 409.8,
        oxygen: 169.9,
        food: 5328.0,
        weight: 1201.2,
        meleeDamageMultiplier: 4.424,
        torpidity: 212160.0,
        totalLevel: 336,
      },
      [
        // health
        46,
        0,
        0,
        // stamina
        49,
        0,
        0,
        // oxygen
        53,
        0,
        0,
        // food
        44,
        0,
        0,
        // weight
        43,
        0,
        0,
        // meleeDamageMultiplier
        43,
        0,
        57,
        // torpidity
        278,
        0,
        0,
        [],
        "ASA",
        1,
      ],
    ],
    [
      {
        type: "bred" as Type,
        imprinting: 1.0,
        name: "せり田山隊長(カマキリ)",
        health: 5060.0,
        stamina: 975.0,
        oxygen: 720.0,
        food: 5616.0,
        weight: 491.0,
        meleeDamageMultiplier: 4.208,
        torpidity: 7098.5,
        totalLevel: 313,
      },
      [
        // health
        38,
        0,
        29,
        // stamina
        55,
        0,
        0,
        // oxygen
        38,
        0,
        0,
        // food
        42,
        0,
        0,
        // weight
        43,
        0,
        0,
        // meleeDamageMultiplier
        49,
        0,
        18,
        // torpidity
        265,
        0,
        0,
        ["ScorchedEarth"],
        "ASA",
        1,
      ],
    ],
    [
      {
        type: "bred" as Type,
        imprinting: 1.0,
        name: "ポイズンワイバーン",
        health: 8694.4,
        stamina: 2701.1,
        oxygen: 570.0,
        food: 8640.0,
        weight: 758.4,
        meleeDamageMultiplier: 2.811,
        torpidity: 9953.3,
        totalLevel: 225,
      },
      [
        // health
        34,
        0,
        0,
        // stamina
        29,
        0,
        50,
        // oxygen
        28,
        0,
        0,
        // food
        30,
        0,
        0,
        // weight
        29,
        0,
        0,
        // meleeDamageMultiplier
        24,
        0,
        0,
        // torpidity
        174,
        0,
        0,
        ["ScorchedEarth"],
        "ASA",
        1,
      ],
    ],
    // テイム効果がめっちゃ刻むときにうまくいかないので、それを直してから
    // [
    //   {
    //     type: "dom" as Type,
    //     imprinting: Math.random(), // bred 以外であればインプリントは関係ないはず
    //     name: "ンリング・ドレイクリン",
    //     health: 1110.1,
    //     stamina: 735.0,
    //     oxygen: 555.0,
    //     food: 4300.0,
    //     weight: 109.2,
    //     meleeDamageMultiplier: 2.904,
    //     torpidity: 1258.5,
    //     totalLevel: 194,
    //   },
    //   [
    //     // health
    //     32,
    //     0,
    //     0,
    //     // stamina
    //     39,
    //     0,
    //     0,
    //     // oxygen
    //     27,
    //     0,
    //     0,
    //     // food
    //     33,
    //     0,
    //     0,
    //     // weight
    //     34,
    //     0,
    //     0,
    //     // meleeDamageMultiplier
    //     28,
    //     0,
    //     0,
    //     // torpidity
    //     193,
    //     0,
    //     0,
    //     ["ScorchedEarth"],
    //     "ASA",
    //     1,
    //   ],
    // ],
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
    const result = calculateLevel({
      bp,
      type: inputs.type,
      imprinting: inputs.imprinting,
      speciesList: speciesList,
      settings,
      values: {
        health: inputs.health,
        stamina: inputs.stamina,
        oxygen: inputs.oxygen,
        food: inputs.food,
        weight: inputs.weight,
        meleeDamageMultiplier: inputs.meleeDamageMultiplier,
        torpidity: inputs.torpidity,
        water: 0, // 無視
        temperature: 0, // 無視
        speedMultiplier: 0, // 無視
        temperatureFortitude: 0, // 無視
        craftingSpeedMultiplier: 0, // 無視
      },
      totalLevel: inputs.totalLevel,
      withDom: true,
    });

    // 5. ステータスを確認して対応する処理を行う
    if (result.status === "failure") expect.fail(JSON.stringify(result));
    const { levels, tameEffectiveness } = result;

    const species = speciesList.find((s) => s.blueprintPath === bp);
    if (!species) throw expect.fail("生物が見つからなんだ");

    expect(levels.health.wild).toBe(expected[0]);
    expect(levels.health.mut).toBe(expected[1]);
    expect(levels.health.dom).toBe(expected[2]);

    expect(levels.stamina.wild).toBe(expected[3]);
    expect(levels.stamina.mut).toBe(expected[4]);
    expect(levels.stamina.dom).toBe(expected[5]);

    expect(levels.oxygen.wild).toBe(expected[6]);
    expect(levels.oxygen.mut).toBe(expected[7]);
    expect(levels.oxygen.dom).toBe(expected[8]);

    expect(levels.food.wild).toBe(expected[9]);
    expect(levels.food.mut).toBe(expected[10]);
    expect(levels.food.dom).toBe(expected[11]);

    expect(levels.weight.wild).toBe(expected[12]);
    expect(levels.weight.mut).toBe(expected[13]);
    expect(levels.weight.dom).toBe(expected[14]);

    expect(levels.meleeDamageMultiplier.wild).toBe(expected[15]);
    expect(levels.meleeDamageMultiplier.mut).toBe(expected[16]);
    expect(levels.meleeDamageMultiplier.dom).toBe(expected[17]);

    expect(levels.torpidity.wild).toBe(expected[18]);
    expect(levels.torpidity.mut).toBe(expected[19]);
    expect(levels.torpidity.dom).toBe(expected[20]);

    expect(species.variants).toStrictEqual(expected[21]);
    expect(species.mod).toBe(expected[22]);

    if (inputs.type === "wild") {
      expect(tameEffectiveness).toBe(0);
    }
    if (inputs.type === "dom") {
      expect(tameEffectiveness).toBe(expected[23]);
    }
    if (inputs.type === "bred") {
      expect(tameEffectiveness).toBe(1);
    }
  });
});

describe("createSettings", () => {
  it("引数なしでデフォルト値が返る", () => {
    const settings = createSettings();
    expect(settings).toStrictEqual(DEFAULT_SETTINGS);
  });
});
