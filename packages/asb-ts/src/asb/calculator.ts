import * as R from "remeda";
import * as v from "valibot";
import { ASBTSErrorCommon } from "./types/error.js";
import {
  BRED_TE,
  type CalculateLevelInputPack,
  type CalculateLevelOutputPack,
  type CalculateValueInputPack,
  type CalculateValueOutputPack,
  DEFAULT_MUTATION_MULTIPLIER,
  DEFAULT_STAT_IMPRINT_MULTIPLIER,
  DEFAULT_TBHM,
  DOM_IMP,
  type Imprinting,
  type LevelDetail,
  LevelDetailSchema,
  type MutationMultiplier,
  POSITIVE_INTEGER_0,
  type PositiveNumber,
  type Settings,
  type Species,
  type SpeciesStat,
  STAT_LABELS,
  type StatLabel,
  type StatLevels,
  StatLevelsSchema,
  type StatMultiplierItem,
  StatValuesSchema,
  type StatValuesUnsafe,
  type TameEffectiveness,
  TE_DIGIT,
  TE_MAX,
  TE_MIN,
  type TeRange,
} from "./types/index.js";

export function calculateValueController(
  ip: CalculateValueInputPack,
): CalculateValueOutputPack {
  let result: StatValuesUnsafe | null = null;
  switch (ip.type) {
    case "wild": {
      result = calculateValueWild(ip);
      break;
    }
    case "dom":
    case "bred": {
      result = calculateValueDomBred(ip);
      break;
    }
  }

  return { values: v.parse(StatValuesSchema, result) };
}

function calculateValueWild(
  ip: Extract<CalculateValueInputPack, { type: "wild" }>,
): StatValuesUnsafe {
  return R.mapValues(ip.levels, (ld, sl) => {
    const stat = ip.species.stats[sl];
    if (ld === undefined || stat === undefined || stat.incPerWildLevel === 0) {
      return undefined;
    } else {
      return cVw(
        sl,
        ld,
        stat,
        ip.species.mutationMultiplier,
        ip.settings.statMultipliers[sl],
      );
    }
  });
}

function calculateValueDomBred(
  ip: Exclude<CalculateValueInputPack, { type: "wild" }>,
): StatValuesUnsafe {
  return R.mapValues(ip.levels, (ld, sl) => {
    const stat = ip.species.stats[sl];
    if (ld === undefined || stat === undefined || stat.incPerWildLevel === 0) {
      return undefined;
    } else {
      return cV(
        sl,
        ld,
        stat,
        ip.type === "dom" ? ip.tameEffectiveness : BRED_TE,
        ip.type === "dom" ? DOM_IMP : ip.imprinting,
        ip.species,
        ip.settings,
      );
    }
  });
}

const PRECISION_10 = 10;
const PRECISION_1000 = 1000; // 近接攻撃力は%で表示されるので小数点以下3桁まで表示する。
const PRECISION_1000_TARGET: StatLabel[] = ["meleeDamageMultiplier"];

function round(num: number, sl: StatLabel): number {
  const precision = PRECISION_1000_TARGET.includes(sl)
    ? PRECISION_1000
    : PRECISION_10;
  return Math.round(num * precision) / precision;
}

function cVw(
  sl: StatLabel,
  ld: LevelDetail,
  stat: SpeciesStat,
  mm: MutationMultiplier | undefined,
  smi: StatMultiplierItem,
): number {
  // 計算の準備
  // 公式wikiの計算式にはない？認識だが、変異のレベルは補正があれば補正をかけてLwと同じように計算する
  // ARKStatsExtractor/ARKBreedingStats/values/Values.cs:594行付近と
  // ARKStatsExtractor/ARKBreedingStats/Stats.cs:58行付近を参照
  const mmi = (mm ?? DEFAULT_MUTATION_MULTIPLIER)[sl];

  // 計算
  const vw =
    stat.baseValue *
    (1 + (ld.wild + ld.mut * mmi) * stat.incPerWildLevel * smi.IwM);
  return vw;
}

function cVpt(
  sl: StatLabel,
  ld: LevelDetail,
  stat: SpeciesStat,
  te: TameEffectiveness,
  imprinting: Imprinting,
  species: Species,
  settings: Settings,
): number {
  // 計算の準備
  const tbhm =
    sl === "health"
      ? (species.tamedBaseHealthMultiplier ?? DEFAULT_TBHM)
      : DEFAULT_TBHM;
  const statImprintMultiplier =
    species.statImprintMultiplier?.[sl] ?? DEFAULT_STAT_IMPRINT_MULTIPLIER[sl];
  const smi = settings.statMultipliers[sl];

  const vw = cVw(sl, ld, stat, species.mutationMultiplier, smi);
  // テイム時の加算ボーナスがマイナスの時はTaM(サーバーの設定)を掛けない。
  // 公式の計算式にはないけどARKStatsExtractor/ARKBreedingStats/values/Values.cs:576行付近にコメントとして記述してある
  const addBounus =
    stat.additiveBonus > 0 ? stat.additiveBonus * smi.TaM : stat.additiveBonus;

  // 計算
  // `Vpt = (Vw × TBHM × (1 + IB × 0.2 × IBM) + Ta × TaM) × (1 + TE × Tm × TmM)` の
  //         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ここの部分
  const tmp1 =
    vw * tbhm * (1 + imprinting * statImprintMultiplier * settings.IBM) +
    addBounus;

  // テイム時の乗算ボーナスがマイナスの時はTmM(サーバーの設定)を掛けない。
  // 公式の計算式にはないけどARKStatsExtractor/ARKBreedingStats/values/Values.cs:580行付近にコメントとして記述してある
  const multiplicativeBonus =
    stat.multiplicativeBonus > 0
      ? stat.multiplicativeBonus * smi.TmM
      : stat.multiplicativeBonus;
  // `Vpt = (Vw × TBHM × (1 + IB × 0.2 × IBM) + Ta × TaM) × (1 + TE × Tm × TmM)` の
  //                                                         ^^^^^^^^^^^^^^^^^ ここの部分
  const tmp2 = 1 + te * multiplicativeBonus;
  return tmp1 * tmp2;
}

function cV(
  sl: StatLabel,
  ld: LevelDetail,
  stat: SpeciesStat,
  te: TameEffectiveness,
  imprinting: Imprinting,
  species: Species,
  settings: Settings,
): number {
  // 計算の準備
  const vpt = cVpt(sl, ld, stat, te, imprinting, species, settings);

  // 計算
  const v =
    vpt * (1 + ld.dom * stat.incPerDomLevel * settings.statMultipliers[sl].IdM);
  return v;
}

export function calculateLevelController(
  ip: CalculateLevelInputPack,
): CalculateLevelOutputPack {
  let levels: StatLevels | null = null;
  let teRange: TeRange | null = null;

  switch (ip.type) {
    case "wild": {
      [levels] = calculateLevelWild(ip);
      break;
    }
    case "dom": {
      [levels, teRange] = calculateLevelDomBred(
        TE_MIN as TameEffectiveness,
        TE_MAX as TameEffectiveness,
        ip,
      );
      break;
    }
    case "bred": {
      [levels, teRange] = calculateLevelDomBred(BRED_TE, BRED_TE, ip);
      break;
    }
  }

  return {
    levels: v.parse(StatLevelsSchema, levels),
    teRange,
  };
}

function calculateLevelWild(
  ip: Extract<CalculateLevelInputPack, { type: "wild" }>,
): [StatLevels] {
  const results = R.mapValues(ip.values, (value, sl) => {
    const stat = ip.species.stats[sl];
    if (
      value === undefined ||
      value === 0 ||
      stat === undefined ||
      stat.incPerWildLevel === 0
    ) {
      return undefined;
    } else {
      return cLw(sl, value, stat, ip);
    }
  });
  return [R.mapValues(results, (result) => result?.ld)];
}

type FlatResult = Partial<Record<StatLabel, CLptResultItem>>;

function calculateLevelDomBred(
  teMin: TameEffectiveness,
  teMax: TameEffectiveness,
  ip: Exclude<CalculateLevelInputPack, { type: "wild" }>,
): [StatLevels, TeRange, number] {
  const cLptResult = R.mapValues(ip.values, (value, sl) => {
    const stat = ip.species.stats[sl];
    if (
      value === undefined ||
      value === 0 ||
      stat === undefined ||
      stat.incPerWildLevel === 0
    ) {
      return undefined;
    } else {
      return cLpt(sl, value, stat, teMin, teMax, ip);
    }
  });
  const cLptEntries = R.entries(cLptResult);

  const flatResults = cLptEntries.reduce((acc, [sl, results]): FlatResult[] => {
    if (results === undefined) {
      return acc;
    } else {
      if (acc.length === 0) {
        return results.map((result) => ({ [sl]: result }));
      } else {
        return acc.flatMap((item) =>
          results.map((result) => ({ ...item, [sl]: result })),
        );
      }
    }
  }, []);

  const removedInvalidTerange = R.pipe(
    flatResults,
    R.filter((result) => toValidTeRange(result) !== null),
  );

  const calcTotalLevel = (fr: FlatResult) =>
    R.pipe(
      R.pickBy(fr, R.isDefined),
      R.entries(),
      R.filter(([sl]) => sl !== "torpidity"),
      R.reduce((acc, [, { ld }]) => acc + ld.wild + ld.mut + ld.dom, 0),
    );
  const [minTotalLevelDiff, minTotalLevelDiffResults] =
    removedInvalidTerange.reduce(
      (acc, fr): [number, FlatResult[]] => {
        const tmpDiff = Math.abs(ip.totalLevel - 1 - calcTotalLevel(fr));
        if (tmpDiff === acc[0]) return [tmpDiff, [...acc[1], fr]];
        else if (tmpDiff < acc[0]) return [tmpDiff, [fr]];
        else return acc;
      },
      [Number.MAX_SAFE_INTEGER, []],
    );

  // レベルの差が同じものが複数ある場合は、ASBと同様に、各statの野生のレベル平均に近い奴を採用する
  // ARKStatsExtractor/ARKBreedingStats/Form1.extractor.cs:422行付近を参照
  const [, targetResults] = minTotalLevelDiffResults.reduce(
    (acc, fr): [number, FlatResult[]] => {
      const tmpTotalLevel = calcTotalLevel(fr);
      const tmpFiltered = R.pipe(
        R.pickBy(fr, R.isDefined),
        R.entries(),
        R.filter(([sl]) => sl !== "torpidity"),
        R.filter(
          ([, { ld }]) =>
            ld.wild === POSITIVE_INTEGER_0 &&
            ld.mut === POSITIVE_INTEGER_0 &&
            ld.dom === POSITIVE_INTEGER_0,
        ),
      );
      const tmpMeanWildLevel = tmpTotalLevel / tmpFiltered.length;
      const tmpDiff = R.pipe(
        tmpFiltered,
        R.reduce(
          (
            acc,
            [
              ,
              {
                ld: { wild },
              },
            ],
          ) => acc + Math.abs(tmpMeanWildLevel - wild),
          0,
        ),
      );
      if (tmpDiff === acc[0]) return [tmpDiff, [...acc[1], fr]];
      else if (tmpDiff < acc[0]) return [tmpDiff, [fr]];
      else return acc;
    },
    [Number.MAX_SAFE_INTEGER, []],
  );
  // targetResults.forEach((result) => console.log(result));

  const target = targetResults[0];
  if (target === undefined) {
    throw new ASBTSErrorCommon(
      "いい感じのレベルが見つからなかったです。",
      "calculateLevelDomBred",
      { teMin, teMax, ip },
    );
  }
  const teRange = toValidTeRange(target);
  if (teRange === null) {
    throw new ASBTSErrorCommon(
      "いい感じのTEが見つからなかったです。",
      "calculateLevelDomBred",
      { teMin, teMax, ip },
    );
  }

  return [
    R.fromKeys(STAT_LABELS, (sl) => target[sl]?.ld),
    teRange,
    minTotalLevelDiff,
  ];
}

function toValidTeRange(result: FlatResult): TeRange | null {
  let teMinTmp = TE_MIN;
  let teMaxTmp = TE_MAX;
  let flag = true;
  for (const item of R.values(result)) {
    if (teMinTmp <= item.teMin && item.teMax <= teMaxTmp) {
      teMinTmp = item.teMin;
      teMaxTmp = item.teMax;
    } else {
      flag = false;
      break;
    }
  }
  return flag
    ? {
        teMin: teMinTmp as TameEffectiveness,
        teMax: teMaxTmp as TameEffectiveness,
      }
    : null;
}

// とりあえずレベル100まで計算する。これ以上は現実的に存在しないと思うので。
const TARGET_LEVEL_DETAIL_LIST_SIZE = 100;
const TARGET_LEVEL_RANGE_WITHOUT_0 = Array.from(
  { length: TARGET_LEVEL_DETAIL_LIST_SIZE },
  (_, i) => i + 1,
);

const TARGET_LEVEL_DETAIL_LIST_WILD = TARGET_LEVEL_RANGE_WITHOUT_0.map((i) =>
  v.parse(LevelDetailSchema, { wild: i, mut: 0, dom: 0 }),
);
const TARGET_LEVEL_RANGE = Array.from(
  { length: TARGET_LEVEL_DETAIL_LIST_SIZE + 1 },
  (_, i) => i,
);
const TARGET_LEVEL_DETAIL_LIST_WILD_MUT = TARGET_LEVEL_RANGE_WITHOUT_0.flatMap(
  (i) =>
    TARGET_LEVEL_RANGE.map((j) =>
      v.parse(LevelDetailSchema, { wild: i, mut: j, dom: 0 }),
    ),
);
const TARGET_LEVEL_DETAIL_LIST_WILD_DOM = TARGET_LEVEL_RANGE_WITHOUT_0.flatMap(
  (i) =>
    TARGET_LEVEL_RANGE.map((k) =>
      v.parse(LevelDetailSchema, { wild: i, mut: 0, dom: k }),
    ),
);
const TARGET_LEVEL_DETAIL_LIST_WILD_MUT_DOM =
  TARGET_LEVEL_RANGE_WITHOUT_0.flatMap((i) =>
    TARGET_LEVEL_RANGE.flatMap((j) =>
      TARGET_LEVEL_RANGE.map((k) =>
        v.parse(LevelDetailSchema, { wild: i, mut: j, dom: k }),
      ),
    ),
  );

// 気絶値とりあえずレベル500まで計算する。これ以上は現実的に存在しないと思うので。
const TARGET_LEVEL_DETAIL_LIST_SIZE_TORPIDITY = 500;
const TARGET_LEVEL_RANGE_TORPIDITY = Array.from(
  { length: TARGET_LEVEL_DETAIL_LIST_SIZE_TORPIDITY },
  (_, i) => i + 1,
);
const TARGET_LEVEL_DETAIL_LIST_WILD_TORPIDITY =
  TARGET_LEVEL_RANGE_TORPIDITY.map((i) =>
    v.parse(LevelDetailSchema, { wild: i, mut: 0, dom: 0 }),
  );

function cLw(
  sl: StatLabel,
  value: PositiveNumber,
  stat: SpeciesStat,
  ip: Extract<CalculateLevelInputPack, { type: "wild" }>,
): { ld: LevelDetail; diff: number } {
  const roundValue = round(value, sl);
  let buffLd: LevelDetail | null = null;
  let buffDiff = Number.MAX_SAFE_INTEGER;

  for (const ld of sl === "torpidity"
    ? TARGET_LEVEL_DETAIL_LIST_WILD_TORPIDITY
    : TARGET_LEVEL_DETAIL_LIST_WILD) {
    const tmpVw = round(
      cVw(
        sl,
        ld,
        stat,
        ip.species.mutationMultiplier,
        ip.settings.statMultipliers[sl],
      ),
      sl,
    );
    const tmpDiff = roundValue - round(tmpVw, sl);
    if (Math.abs(tmpDiff) < Math.abs(buffDiff)) {
      buffLd = ld;
      buffDiff = tmpDiff;
    }
  }
  if (buffLd === null) {
    throw new ASBTSErrorCommon(
      "いい感じの野生のレベルが見つからなかったです。",
      "cLw",
      { sl, value, stat, ip },
    );
  }
  return { ld: buffLd, diff: buffDiff };
}

type CLptResultItem = {
  ld: LevelDetail;
  teMin: TameEffectiveness;
  teMax: TameEffectiveness;
};

function cLpt(
  sl: StatLabel,
  value: PositiveNumber,
  stat: SpeciesStat,
  teMin: TameEffectiveness,
  teMax: TameEffectiveness,
  ip: Exclude<CalculateLevelInputPack, { type: "wild" }>,
): [CLptResultItem, ...CLptResultItem[]] {
  const roundValue = round(value, sl);
  const buff: CLptResultItem[] = [];

  const mm = (ip.species.mutationMultiplier ?? DEFAULT_MUTATION_MULTIPLIER)[sl];
  const targetLevel =
    sl === "torpidity"
      ? TARGET_LEVEL_DETAIL_LIST_WILD_TORPIDITY
      : ip.withDom
        ? ip.type === "dom"
          ? TARGET_LEVEL_DETAIL_LIST_WILD_DOM
          : mm === 1
            ? TARGET_LEVEL_DETAIL_LIST_WILD_DOM
            : TARGET_LEVEL_DETAIL_LIST_WILD_MUT_DOM
        : ip.type === "dom"
          ? TARGET_LEVEL_DETAIL_LIST_WILD
          : mm === 1
            ? TARGET_LEVEL_DETAIL_LIST_WILD
            : TARGET_LEVEL_DETAIL_LIST_WILD_MUT;
  for (const ld of targetLevel) {
    const fnCV = (te: TameEffectiveness) =>
      round(
        cV(
          sl,
          ld,
          stat,
          te,
          ip.type === "dom" ? DOM_IMP : ip.imprinting,
          ip.species,
          ip.settings,
        ),
        sl,
      );
    const teMinTmp = binarySearchMax(
      TE_DIGIT,
      teMin,
      teMax,
      (te) => fnCV(te) <= roundValue,
    );
    const teMaxTmp = binarySearchMin(
      TE_DIGIT,
      teMin,
      teMax,
      (te) => fnCV(te) >= roundValue,
    );
    if (teMinTmp !== null && teMaxTmp !== null) {
      buff.push({ ld, teMin: teMinTmp, teMax: teMaxTmp });
    }
  }
  const first = buff[0];
  if (first) {
    return [first, ...buff];
  } else {
    throw new ASBTSErrorCommon(
      "いい感じのレベルが見つからなかったです。",
      "cLpt",
      { sl, value, stat, teMin, teMax, ip },
    );
  }
}

function binarySearchMax(
  digit: number,
  teMin: TameEffectiveness,
  teMax: TameEffectiveness,
  check: (te: TameEffectiveness) => boolean,
): TameEffectiveness | null {
  const teRange = teMax - teMin;
  const range = 10 ** digit;
  let left = teMin;
  let right = teMax;
  let result = null;

  if (teRange <= 0) {
    if (check(left)) {
      result = left;
    }
  } else {
    while (left <= right) {
      const mid = ((left + right) / 2) as TameEffectiveness;

      if (check(mid)) {
        result = mid; // midは条件を満たすので、一旦キープ
        left = (mid + teRange / range) as TameEffectiveness; // さらに大きい値（右側）に満たすものがないか探す
      } else {
        right = (mid - teRange / range) as TameEffectiveness; // midが条件を満たさないので、より小さい範囲（左側）を探す
      }
    }
  }

  return result;
}

function binarySearchMin(
  digit: number,
  teMin: TameEffectiveness,
  teMax: TameEffectiveness,
  check: (te: TameEffectiveness) => boolean,
): TameEffectiveness | null {
  const teRange = teMax - teMin;
  const range = 10 ** digit;
  let left = teMin;
  let right = teMax;
  let result = null;

  if (teRange <= 0) {
    if (check(left)) {
      result = left;
    }
  } else {
    while (left <= right) {
      const mid = ((left + right) / 2) as TameEffectiveness;
      if (check(mid)) {
        result = mid; // midは条件を満たすので、一旦キープ
        right = (mid - teRange / range) as TameEffectiveness; // midが条件を満たさないので、より小さい範囲（左側）を探す
      } else {
        left = (mid + teRange / range) as TameEffectiveness; // さらに大きい値（右側）に満たすものがないか探す
      }
    }
  }

  return result;
}
