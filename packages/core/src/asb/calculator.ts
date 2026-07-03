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
  type Diffs,
  DOM_IMP,
  type Imprinting,
  type LevelDetail,
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
  let diffs: Diffs | null = null;

  switch (ip.type) {
    case "wild": {
      [levels, diffs] = calculateLevelWild(ip);
      break;
    }
    case "dom": {
      [levels, teRange, diffs] = calculateLevelDomBred(
        { teMin: TE_MIN, teMax: TE_MAX } as TeRange,
        ip,
      );
      break;
    }
    case "bred": {
      [levels, teRange, diffs] = calculateLevelDomBred(
        { teMin: BRED_TE, teMax: BRED_TE },
        ip,
      );
      break;
    }
  }

  return {
    levels: v.parse(StatLevelsSchema, levels),
    teRange,
    diffs,
  };
}

function calculateLevelWild(
  ip: Extract<CalculateLevelInputPack, { type: "wild" }>,
): [StatLevels, Diffs] {
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
  return [
    R.mapValues(results, (result) => result?.ld),
    {
      totalLevelDiff: ip.totalLevel - 1 - calcTotalLevel(results),
      statDiffs: R.fromKeys(STAT_LABELS, (sl) => results[sl]?.diff),
    },
  ];
}

type FlatResult = Partial<Record<StatLabel, CLptResultItem>>;

function calculateLevelDomBred(
  teRange: TeRange,
  ip: Exclude<CalculateLevelInputPack, { type: "wild" }>,
): [StatLevels, TeRange, Diffs] {
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
      return cL(sl, value, stat, teRange, ip);
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
            ld.wild !== POSITIVE_INTEGER_0 ||
            ld.mut !== POSITIVE_INTEGER_0 ||
            ld.dom !== POSITIVE_INTEGER_0,
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

  const target = targetResults[0];
  if (target === undefined) {
    throw new ASBTSErrorCommon(
      "いい感じのレベルが見つからなかったです。",
      "calculateLevelDomBred",
      { teRange, ip },
    );
  }
  const teRangeTmp = toValidTeRange(target);
  if (teRangeTmp === null) {
    throw new ASBTSErrorCommon(
      "いい感じのTEが見つからなかったです。",
      "calculateLevelDomBred",
      { teRange, ip },
    );
  }

  return [
    R.fromKeys(STAT_LABELS, (sl) => target[sl]?.ld),
    { ...teRangeTmp },
    {
      totalLevelDiff: minTotalLevelDiff,
      statDiffs: R.fromKeys(STAT_LABELS, (sl) => target[sl]?.diff),
    },
  ];
}

function calcTotalLevel(
  fr: Partial<Record<StatLabel, { ld: LevelDetail } | undefined>>,
): number {
  return R.pipe(
    R.pickBy(fr, R.isDefined),
    R.entries(),
    R.filter(([sl]) => sl !== "torpidity"),
    R.reduce((acc, [, { ld }]) => acc + ld.wild + ld.mut + ld.dom, 0),
  );
}

function toValidTeRange(result: FlatResult): TeRange | null {
  let teMinTmp = TE_MIN;
  let teMaxTmp = TE_MAX;
  let flag = true;
  for (const {
    teRange: { teMin, teMax },
  } of R.values(result)) {
    if (teMin <= teMaxTmp && teMinTmp <= teMax) {
      teMinTmp = Math.max(teMin, teMinTmp) as TameEffectiveness;
      teMaxTmp = Math.min(teMax, teMaxTmp) as TameEffectiveness;
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
const TARGET_LEVEL_DETAIL_RANGE = 100;
// 気絶値とりあえずレベル500まで計算する。これ以上は現実的に存在しないと思うので。
const TARGET_LEVEL_DETAIL_RANGE_TORPIDITY = 500;

function cLw(
  sl: StatLabel,
  value: PositiveNumber,
  stat: SpeciesStat,
  ip: Extract<CalculateLevelInputPack, { type: "wild" }>,
): { ld: LevelDetail; diff: number } {
  const roundValue = round(value, sl);
  let buffLd: LevelDetail | null = null;
  let buffDiff = Number.MAX_SAFE_INTEGER;

  const target =
    sl === "torpidity"
      ? TARGET_LEVEL_DETAIL_RANGE_TORPIDITY
      : TARGET_LEVEL_DETAIL_RANGE;
  for (let wild = 1; wild < target; wild++) {
    const ld = { wild, mut: 0, dom: 0 } as LevelDetail;
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

const TARGET_WILD_TORPIDITY = {
  w: TARGET_LEVEL_DETAIL_RANGE_TORPIDITY,
  m: 1,
  d: 1,
} as const;

const TARGET_WILD = {
  w: TARGET_LEVEL_DETAIL_RANGE,
  m: 1,
  d: 1,
} as const;

const TARGET_WILD_DOM = {
  w: TARGET_LEVEL_DETAIL_RANGE,
  m: 1,
  d: TARGET_LEVEL_DETAIL_RANGE,
} as const;

const TARGET_WILD_MUT = {
  w: TARGET_LEVEL_DETAIL_RANGE,
  m: TARGET_LEVEL_DETAIL_RANGE,
  d: 1,
} as const;

const TARGET_WILD_MUT_DOM = {
  w: TARGET_LEVEL_DETAIL_RANGE,
  m: TARGET_LEVEL_DETAIL_RANGE,
  d: TARGET_LEVEL_DETAIL_RANGE,
} as const;

type CLptResultItem = {
  ld: LevelDetail;
  teRange: TeRange;
  diff: number;
};

function cL(
  sl: StatLabel,
  value: PositiveNumber,
  stat: SpeciesStat,
  teRange: TeRange,
  ip: Exclude<CalculateLevelInputPack, { type: "wild" }>,
): [CLptResultItem, ...CLptResultItem[]] {
  const roundedValue = round(value, sl);
  let resultBuff: CLptResultItem[] = [];
  let diffBuff = Number.MAX_SAFE_INTEGER;

  const mm = (ip.species.mutationMultiplier ?? DEFAULT_MUTATION_MULTIPLIER)[sl];
  const target =
    sl === "torpidity"
      ? TARGET_WILD_TORPIDITY
      : ip.withDom
        ? ip.type === "dom"
          ? TARGET_WILD_DOM
          : mm === 1
            ? TARGET_WILD_DOM
            : TARGET_WILD_MUT_DOM
        : ip.type === "dom"
          ? TARGET_WILD
          : mm === 1
            ? TARGET_WILD
            : TARGET_WILD_MUT;
  for (let dom = 0; dom < target.d; dom++) {
    for (let mut = 0; mut < target.m; mut++) {
      let previosDiff = Number.MAX_SAFE_INTEGER;
      for (let wild = 1; wild < target.w; wild++) {
        const ld = { wild, mut, dom } as LevelDetail;
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
        const [teRangeTmp, diffTmp] = searchTeRange(
          TE_DIGIT,
          teRange,
          fnCV,
          roundedValue,
        );
        if (Math.abs(diffTmp) < Math.abs(diffBuff)) {
          resultBuff = [{ ld, teRange: teRangeTmp, diff: diffTmp }];
          diffBuff = diffTmp;
        } else if (Math.abs(diffTmp) === Math.abs(diffBuff)) {
          resultBuff.push({ ld, teRange: teRangeTmp, diff: diffTmp });
        }
        if (Math.abs(previosDiff) <= Math.abs(diffTmp)) {
          break;
        }
        previosDiff = diffTmp;
      }
    }
  }
  const first = resultBuff[0];
  if (first) {
    return [first, ...resultBuff.slice(1)];
  } else {
    throw new ASBTSErrorCommon(
      "いい感じのレベルが見つからなかったです。",
      "cLpt",
      { sl, value, stat, teRange, ip },
    );
  }
}

function searchTeRange(
  digit: number,
  teRange: TeRange,
  fn: (te: TameEffectiveness) => number,
  target: number,
): [TeRange, number] {
  const teRangeTarget = teRange.teMax - teRange.teMin;
  if (teRangeTarget < 0) {
    throw new ASBTSErrorCommon(
      "TEの調べる範囲がおかしいです",
      "searchTeRange",
      { teRange },
    );
  } else if (teRangeTarget === 0) {
    if (fn(teRange.teMin) === target) {
      return [teRange, 0];
    }
  }
  const min = fn(teRange.teMin);
  const max = fn(teRange.teMax);
  if (target < min || max < target) {
    return [
      { teMin: teRange.teMin, teMax: teRange.teMax },
      target - (min + max) / 2,
    ];
  } else if (min === max) {
    return [{ teMin: teRange.teMin, teMax: teRange.teMax }, target - min];
  } else if (min === target) {
    return [{ teMin: teRange.teMin, teMax: teRange.teMin }, 0];
  } else if (max === target) {
    return [{ teMin: teRange.teMax, teMax: teRange.teMax }, 0];
  }

  const teRangeBuff = { ...teRange };
  const range = 10 ** digit;
  let left = 0;
  let right = range;
  while (left <= right) {
    const mid = (left + right) >> 1;
    const teMid = (mid / range) as TameEffectiveness;
    const tmp = fn(teMid);
    if (tmp <= target) {
      teRangeBuff.teMin = teMid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  right = range;
  while (left <= right) {
    const mid = (left + right) >> 1;
    const teMid = (mid / range) as TameEffectiveness;
    const tmp = fn(teMid);
    if (tmp < target) {
      left = mid + 1;
    } else {
      teRangeBuff.teMax = teMid;
      right = mid - 1;
    }
  }
  return [teRangeBuff, 0];
}
