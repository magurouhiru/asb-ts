import * as v from "valibot";
import { toOutputPackFailure } from "../util.js";
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
  LevelsSchema,
  type Meta,
  type MutationMultiplier,
  type Settings,
  type Species,
  type StatMultiplierItem,
  type Stats,
  type StatsMeta,
  type StatsMetaDetail,
  type StatsName,
  StatsNames,
  type TameEffectiveness,
  TameEffectivenessSchema,
  TE_MAX,
  type TotalLevel,
  type Type,
  ValuesSchema,
  WILD_IMP,
  WILD_TE,
} from "./types/index.js";

export function calculateValueController(
  ip: CalculateValueInputPack,
): CalculateValueOutputPack {
  let result: { [k: string]: number } | null = null;
  let statsMeta: StatsMeta | null = null;
  const meta = createMeta();
  switch (ip.type) {
    case "wild": {
      const isTameEffectivenessCalculatedAsZero =
        ip.tameEffectiveness !== WILD_TE;
      if (isTameEffectivenessCalculatedAsZero) {
        ip.tameEffectiveness = WILD_TE;
        meta.isTameEffectivenessCalculatedAsZero = true;
      }
      const isImprintingCalculatedAsZero = ip.imprinting !== WILD_IMP;
      if (isImprintingCalculatedAsZero) {
        ip.imprinting = WILD_IMP;
        meta.isImprintingCalculatedAsZero = true;
      }
      [result, statsMeta] = calculateValueWild(ip);
      break;
    }
    case "dom": {
      const isImprintingCalculatedAsZero = ip.imprinting !== DOM_IMP;
      if (isImprintingCalculatedAsZero) {
        ip.imprinting = DOM_IMP;
        meta.isImprintingCalculatedAsZero = true;
      }
      [result, statsMeta] = calculateValueDomBred(ip);
      break;
    }
    case "bred": {
      const isTameEffectivenessCalculatedAsOne =
        ip.tameEffectiveness !== BRED_TE;
      if (isTameEffectivenessCalculatedAsOne) {
        ip.tameEffectiveness = BRED_TE;
        meta.isTameEffectivenessCalculatedAsOne = true;
      }
      [result, statsMeta] = calculateValueDomBred(ip);
      break;
    }
  }

  const parsed = v.safeParse(ValuesSchema, result);
  if (parsed.success) {
    meta.statsMeta = statsMeta;
    return { status: "success", values: parsed.output, meta };
  } else {
    return toOutputPackFailure("internal_error", parsed.issues);
  }
}

function calculateValueWild(
  ip: Omit<CalculateValueInputPack, "type"> & { type: "wild" },
): [{ [k: string]: number }, StatsMeta] {
  const result = StatsNames.map((sn) => {
    const [vw, statsMetaDetail] = cVw(
      ip.type,
      sn,
      ip.levels[sn],
      ip.species.stats,
      ip.species.mutationMultiplier,
      ip.settings.statMultipliers[sn],
    );
    return { sn, vw, statsMetaDetail };
  });

  return [
    Object.fromEntries(result.map(({ sn, vw }) => [sn, round(vw, sn)])),
    Object.fromEntries(
      result.map(({ sn, statsMetaDetail }) => [sn, statsMetaDetail]),
    ),
  ];
}

function calculateValueDomBred(
  ip: Omit<CalculateValueInputPack, "type"> & { type: "dom" | "bred" },
): [{ [k: string]: number }, StatsMeta] {
  const result = StatsNames.map((sn) => {
    const [v, statsMetaDetail] = cV(
      ip.type,
      sn,
      ip.levels[sn],
      ip.tameEffectiveness,
      ip.imprinting,
      ip.species,
      ip.settings,
    );
    return { sn, v, statsMetaDetail };
  });

  return [
    Object.fromEntries(result.map(({ sn, v }) => [sn, round(v, sn)])),
    Object.fromEntries(
      result.map(({ sn, statsMetaDetail }) => [sn, statsMetaDetail]),
    ),
  ];
}

const PRECISION_10 = 10;
const PRECISION_1000 = 1000; // 近接攻撃力は%で表示されるので小数点以下3桁まで表示する。
const PRECISION_1000_TARGET: StatsName[] = ["meleeDamageMultiplier"];

function round(num: number, sn: StatsName): number {
  const precision = PRECISION_1000_TARGET.includes(sn)
    ? PRECISION_1000
    : PRECISION_10;
  return Math.round(num * precision) / precision;
}

function cVw(
  type: Type,
  sn: StatsName,
  ld: LevelDetail,
  stats: Stats,
  mm: MutationMultiplier | undefined,
  smi: StatMultiplierItem,
): [number, StatsMetaDetail] {
  const stat = stats[sn];
  if (!stat) return [0, { hasMissingStatsForCalculation: true }];
  const statsMetaDetail: StatsMetaDetail = {};

  // 計算の準備
  // 公式wikiの計算式にはない？認識だが、変異のレベルは補正があれば補正をかけてLwと同じように計算する
  // ARKStatsExtractor/ARKBreedingStats/values/Values.cs:594行付近と
  // ARKStatsExtractor/ARKBreedingStats/Stats.cs:58行付近を参照
  const mmi = (mm ?? DEFAULT_MUTATION_MULTIPLIER)[sn];
  if (mmi === 1) {
    statsMetaDetail.equalWildMutationRates = true;
  }

  const isMutLevelCalculatedAsZero =
    ld.mut !== 0 && (type === "wild" || type === "dom");
  const mut = isMutLevelCalculatedAsZero ? 0 : ld.mut;
  if (isMutLevelCalculatedAsZero) {
    statsMetaDetail.isMutLevelCalculatedAsZero = true;
  }

  const isDomLevelCalculatedAsZero = ld.dom !== 0 && type === "wild";
  if (isDomLevelCalculatedAsZero) {
    statsMetaDetail.isDomLevelCalculatedAsZero = true;
  }

  // 計算
  const vw =
    stat.baseValue *
    (1 + (ld.wild + mut * mmi) * stat.incPerWildLevel * smi.IwM);
  return [vw, statsMetaDetail];
}

function cVpt(
  type: Exclude<Type, "wild">,
  sn: StatsName,
  ld: LevelDetail,
  te: TameEffectiveness,
  imprinting: Imprinting,
  species: Species,
  settings: Settings,
): [number, StatsMetaDetail] {
  const stat = species.stats[sn];
  if (!stat) return [0, { hasMissingStatsForCalculation: true }];

  // 計算の準備
  const tbhm =
    sn === "health"
      ? (species.tamedBaseHealthMultiplier ?? DEFAULT_TBHM)
      : DEFAULT_TBHM;
  const statImprintMultiplier =
    species.statImprintMultiplier?.[sn] ?? DEFAULT_STAT_IMPRINT_MULTIPLIER[sn];
  const smi = settings.statMultipliers[sn];

  const [vw, statsMetaDetail] = cVw(
    type,
    sn,
    ld,
    species.stats,
    species.mutationMultiplier,
    smi,
  );
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
  return [tmp1 * tmp2, statsMetaDetail];
}

function cV(
  type: Exclude<Type, "wild">,
  sn: StatsName,
  ld: LevelDetail,
  te: TameEffectiveness,
  imprinting: Imprinting,
  species: Species,
  settings: Settings,
): [number, StatsMetaDetail] {
  const stat = species.stats[sn];
  if (!stat) return [0, { hasMissingStatsForCalculation: true }];

  // 計算の準備
  const [vpt, statsMetaDetail] = cVpt(
    type,
    sn,
    ld,
    te,
    imprinting,
    species,
    settings,
  );
  statsMetaDetail.isDomLevelCalculatedAsZero = false;

  // 計算
  const v =
    vpt * (1 + ld.dom * stat.incPerDomLevel * settings.statMultipliers[sn].IdM);
  return [v, statsMetaDetail];
}

export function calculateLevelController(
  ip: CalculateLevelInputPack,
): CalculateLevelOutputPack {
  try {
    let levels: { [k: string]: LevelDetail } | null = null;
    let te: TameEffectiveness | null = null;
    let meta: Meta | null = null;
    switch (ip.type) {
      case "wild": {
        const isImprintingCalculatedAsZero = ip.imprinting !== WILD_IMP;
        if (isImprintingCalculatedAsZero) {
          ip.imprinting = WILD_IMP;
        }
        [levels, meta] = calculateLevelWild(ip);
        te = WILD_TE;
        if (isImprintingCalculatedAsZero) {
          meta.isImprintingCalculatedAsZero = true;
        }
        break;
      }
      case "dom": {
        const isImprintingCalculatedAsZero = ip.imprinting !== DOM_IMP;
        if (isImprintingCalculatedAsZero) {
          ip.imprinting = DOM_IMP;
        }
        [levels, te, meta] = calculateLevelDom(ip);
        if (isImprintingCalculatedAsZero) {
          meta.isImprintingCalculatedAsZero = true;
        }
        break;
      }
      case "bred": {
        [levels, meta] = calculateLevelBred(ip);
        te = BRED_TE;
        break;
      }
    }

    const parsed = v.safeParse(LevelsSchema, levels);
    if (parsed.success) {
      return {
        status: "success",
        levels: parsed.output,
        tameEffectiveness: te,
        meta,
      };
    } else {
      return toOutputPackFailure("internal_error", parsed.issues);
    }
  } catch (e) {
    if (e instanceof Error) {
      return {
        status: "failure",
        errorType: "internal_error",
        errors: [
          {
            path: typeof e.cause === "string" ? e.cause : "root",
            message: e.message,
          },
        ],
      };
    } else {
      return {
        status: "failure",
        errorType: "internal_error",
        errors: [{ path: "root", message: JSON.stringify(e) }],
      };
    }
  }
}

function calculateLevelWild(
  ip: Extract<CalculateLevelInputPack, { type: "wild" }>,
): [{ [k: string]: LevelDetail }, Meta] {
  const meta = createMeta();
  const result = StatsNames.map((sn) => {
    const [ld, smd] = cLw(sn, ip);
    return { sn, ld, smd };
  });
  const levels = Object.fromEntries(result.map(({ sn, ld }) => [sn, ld]));
  result.forEach(({ sn, smd }) => {
    if (!smd) return;
    else meta.statsMeta[sn] = smd;
  });
  const tmpTotalLevelDiff = ip.totalLevel - sumLevels(levels);
  if (tmpTotalLevelDiff === 0) {
    meta.totalLevelDiff = tmpTotalLevelDiff;
  }
  return [levels, meta];
}

const TARGET_TE_LIST_SIZE = 100;
const TARGET_TE_LIST = Array.from(
  { length: TE_MAX * TARGET_TE_LIST_SIZE + 1 },
  (_, i) => v.parse(TameEffectivenessSchema, i / TARGET_TE_LIST_SIZE),
);
function calculateLevelDom(
  ip: Extract<CalculateLevelInputPack, { type: "dom" }>,
): [{ [k: string]: LevelDetail }, TameEffectiveness, Meta] {
  let buffTotalLevelDiff = Number.MAX_SAFE_INTEGER;
  let buffDiff = Number.MAX_SAFE_INTEGER;
  let buffLevels: { [k: string]: LevelDetail } | null = null;
  let buffTe: TameEffectiveness | null = null;
  let buffMeta: Meta | null = null;
  for (const te of TARGET_TE_LIST) {
    const [tmpLevels, tmpMeta] = calculateLevelDomCore(te, ip, createMeta());
    const tmpSumDiff = StatsNames.reduce(
      (acc, sn) =>
        acc +
        Math.abs(tmpMeta.statsMeta[sn]?.valueDiff ?? 0) /
          (ip.species.stats[sn]?.baseValue ?? 1),
      0,
    );
    const tmpTotalLevelDiff = Math.abs(tmpMeta.totalLevelDiff ?? 0);
    if (tmpTotalLevelDiff < buffTotalLevelDiff) {
      buffTotalLevelDiff = tmpTotalLevelDiff;
      buffDiff = tmpSumDiff;
      buffLevels = tmpLevels;
      buffTe = te;
      buffMeta = tmpMeta;
    } else if (
      tmpTotalLevelDiff === buffTotalLevelDiff &&
      tmpSumDiff <= buffDiff
    ) {
      buffTotalLevelDiff = tmpTotalLevelDiff;
      buffDiff = tmpSumDiff;
      buffLevels = tmpLevels;
      buffTe = te;
      buffMeta = tmpMeta;
    }
  }
  if (buffLevels === null || buffTe === null || buffMeta === null)
    throw new Error("calculateLevelDom で失敗しました。", { cause: "root" });
  return [buffLevels, buffTe, buffMeta];
}

function calculateLevelBred(
  ip: Extract<CalculateLevelInputPack, { type: "bred" }>,
): [{ [k: string]: LevelDetail }, Meta] {
  const meta = createMeta();
  return calculateLevelDomCore(BRED_TE, ip, meta);
}

function calculateLevelDomCore(
  te: TameEffectiveness,
  ip: Exclude<CalculateLevelInputPack, { type: "wild" }>,
  _meta: Meta,
): [{ [k: string]: LevelDetail }, Meta] {
  const tmp = Object.fromEntries(
    StatsNames.map((sn) => [sn, cLpt(sn, te, ip)]),
  );
  type TmpResult = Partial<Record<StatsName, LevelDetail>>;
  type Obj = { r: TmpResult; m: StatsMeta };
  const objList: Obj[] = [];

  const flatComb = (i: number, obj: Obj) => {
    if (i === StatsNames.length) {
      objList.push(obj);
      return;
    }
    const sn = StatsNames[i];
    if (!sn) throw new Error("バグです1");
    const tmpSn = tmp[sn];
    if (!tmpSn) throw new Error("バグです2");
    tmpSn.forEach(({ levelDetail, statsMetaDetail }) => {
      const r = { ...obj.r };
      r[sn] = levelDetail;
      const m = { ...obj.m };
      m[sn] = statsMetaDetail;
      flatComb(i + 1, { r, m });
    });
  };

  flatComb(0, { r: {}, m: {} });

  const minTotalLevelDiff = objList.reduce((acc, { r }) => {
    const tmpDiff = calcTotalLevelDiff(ip.totalLevel, r);
    if (tmpDiff < acc) return tmpDiff;
    else return acc;
  }, Number.MAX_SAFE_INTEGER);
  const minDiffObjList = objList.filter(({ r }) => {
    const tmpDiff = calcTotalLevelDiff(ip.totalLevel, r);
    return minTotalLevelDiff === tmpDiff;
  });

  let targetObje = minDiffObjList[0];
  if (!targetObje) throw new Error("バグです3");

  if (minDiffObjList.length > 1) {
    // レベルの差が同じものが複数ある場合は、ASBと同様に、各statの野生のレベル平均に近い奴を採用する
    // ARKStatsExtractor/ARKBreedingStats/Form1.extractor.cs:422行付近を参照
    const { obj } = minDiffObjList.reduce(
      (acc, obj) => {
        const not0 = StatsNames.filter((sn) => (obj.r[sn]?.wild ?? 0) !== 0);
        const cntNot0 = not0.reduce((acc_1, sn) => {
          if (sn === "torpidity") return acc_1;
          else if (obj.r[sn]?.wild === 0) return acc_1;
          else return acc_1 + 1;
        }, 0);
        const sum = sumLevels(obj.r);
        const meanLevel = sum / cntNot0;
        const meanLevelDiff = not0.reduce((acc_2, sn) => {
          const tmpMeanLevel = obj.r[sn]?.wild ?? 0;
          if (sn === "torpidity") return acc_2;
          else return acc_2 + Math.abs(meanLevel - tmpMeanLevel);
        }, 0);
        if (meanLevelDiff < acc.meanLevelDiff) return { meanLevelDiff, obj };
        else return acc;
      },
      {
        meanLevelDiff: Number.MAX_SAFE_INTEGER,
        obj: targetObje,
      },
    );
    targetObje = obj;
  }
  return [
    targetObje.r,
    { statsMeta: targetObje.m, totalLevelDiff: minTotalLevelDiff ?? undefined },
  ];
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

const LEVEL_DETAIL_0 = { wild: 0, mut: 0, dom: 0 } satisfies LevelDetail;

function cLw(
  sn: StatsName,
  ip: Extract<CalculateLevelInputPack, { type: "wild" }>,
): [LevelDetail, StatsMetaDetail] {
  const stat = ip.species.stats[sn];
  const value = ip.values[sn];
  if (!stat || stat.incPerWildLevel <= 0 || value <= 0)
    return [
      LEVEL_DETAIL_0,
      {
        hasMissingStatsForCalculation: value > 0,
      },
    ];
  let buffLd: LevelDetail | null = null;
  let buffDiff = Number.MAX_SAFE_INTEGER;
  let buffStatsMetaDetail: StatsMetaDetail = {};

  for (const ld of sn === "torpidity"
    ? TARGET_LEVEL_DETAIL_LIST_WILD_TORPIDITY
    : TARGET_LEVEL_DETAIL_LIST_WILD) {
    const [tmpVw, tmpStatsMetaDetail] = cVw(
      ip.type,
      sn,
      ld,
      ip.species.stats,
      ip.species.mutationMultiplier,
      ip.settings.statMultipliers[sn],
    );
    const tmpDiff = value - round(tmpVw, sn);
    if (Math.abs(tmpDiff) < Math.abs(buffDiff)) {
      buffLd = ld;
      buffDiff = tmpDiff;
      buffStatsMetaDetail = tmpStatsMetaDetail;
    }
  }
  if (buffLd === null) {
    throw new Error("cLw で失敗しました。", { cause: `levels.${sn}` });
  }
  if (buffDiff !== 0) {
    buffStatsMetaDetail.valueDiff = buffDiff;
  }
  return [buffLd, buffStatsMetaDetail];
}

function cLpt(
  sn: StatsName,
  te: TameEffectiveness,
  ip: Exclude<CalculateLevelInputPack, { type: "wild" }>,
): { levelDetail: LevelDetail; statsMetaDetail: StatsMetaDetail }[] {
  const stat = ip.species.stats[sn];
  const value = ip.values[sn];
  if (!stat || stat.incPerWildLevel <= 0 || value <= 0)
    return [
      {
        levelDetail: LEVEL_DETAIL_0,
        statsMetaDetail: { hasMissingStatsForCalculation: value > 0 },
      },
    ];
  let buffDiff = Number.MAX_SAFE_INTEGER;
  let buff: { levelDetail: LevelDetail; statsMetaDetail: StatsMetaDetail }[] =
    [];

  const mm = (ip.species.mutationMultiplier ?? DEFAULT_MUTATION_MULTIPLIER)[sn];
  const targetLevel =
    sn === "torpidity"
      ? TARGET_LEVEL_DETAIL_LIST_WILD_TORPIDITY
      : ip.type === "dom"
        ? TARGET_LEVEL_DETAIL_LIST_WILD_DOM
        : mm === 1
          ? TARGET_LEVEL_DETAIL_LIST_WILD_DOM
          : TARGET_LEVEL_DETAIL_LIST_WILD_MUT_DOM;
  for (const ld of targetLevel) {
    const [tmpVpt, tmpStatsMetaDetail] = cV(
      ip.type,
      sn,
      ld,
      te,
      ip.imprinting,
      ip.species,
      ip.settings,
    );
    const tmpDiff = value - round(tmpVpt, sn);
    if (tmpDiff !== 0) {
      tmpStatsMetaDetail.valueDiff = buffDiff;
    }
    if (Math.abs(tmpDiff) === Math.abs(buffDiff)) {
      buff.push({ levelDetail: ld, statsMetaDetail: tmpStatsMetaDetail });
    }
    if (Math.abs(tmpDiff) < Math.abs(buffDiff)) {
      buffDiff = tmpDiff;
      buff = [{ levelDetail: ld, statsMetaDetail: tmpStatsMetaDetail }];
    }
  }
  if (buff.length <= 0) {
    throw new Error("cLpt で失敗しました。", { cause: `levels.${sn}` });
  }
  return buff;
}

function createMeta(): Meta {
  return { statsMeta: {} };
}

function sumLevels(levels: { [k: string]: LevelDetail }) {
  return Object.entries(levels).reduce((acc, [sn, ld]) => {
    if (sn === "torpidity") return acc;
    else return acc + ld.wild + ld.mut + ld.dom;
  }, 0);
}

function calcTotalLevelDiff(
  tl: TotalLevel,
  levels: { [k: string]: LevelDetail },
) {
  const sum = sumLevels(levels);
  return Math.abs(tl - 1 - sum);
}
