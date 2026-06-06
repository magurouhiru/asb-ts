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
  meta: Meta,
): [{ [k: string]: LevelDetail }, Meta] {
  const result = {
    health_result: cLpt("health", te, ip),
    stamina_result: cLpt("stamina", te, ip),
    oxygen_result: cLpt("oxygen", te, ip),
    food_result: cLpt("food", te, ip),

    water_result: cLpt("water", te, ip),
    temperature_result: cLpt("temperature", te, ip),
    weight_result: cLpt("weight", te, ip),
    meleeDamageMultiplier_result: cLpt("meleeDamageMultiplier", te, ip),

    speedMultiplier_result: cLpt("speedMultiplier", te, ip),
    temperatureFortitude_result: cLpt("temperatureFortitude", te, ip),
    craftingSpeedMultiplier_result: cLpt("craftingSpeedMultiplier", te, ip),
    torpidity_result: cLpt("torpidity", te, ip),
  };

  type Obj = Record<
    StatsName,
    { levelDetail: LevelDetail; statsMetaDetail: StatsMetaDetail }
  >;
  const objList: Obj[] = [];

  for (const health of result.health_result) {
    for (const stamina of result.stamina_result) {
      for (const oxygen of result.oxygen_result) {
        for (const food of result.food_result) {
          //
          for (const water of result.water_result) {
            for (const temperature of result.temperature_result) {
              for (const weight of result.weight_result) {
                for (const meleeDamageMultiplier of result.meleeDamageMultiplier_result) {
                  //
                  for (const speedMultiplier of result.speedMultiplier_result) {
                    for (const temperatureFortitude of result.temperatureFortitude_result) {
                      for (const craftingSpeedMultiplier of result.craftingSpeedMultiplier_result) {
                        for (const torpidity of result.torpidity_result) {
                          objList.push({
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
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  const calcTLDiff = (obj: Obj) =>
    ip.totalLevel -
    1 -
    Object.entries(obj).reduce((acc, [sn, { levelDetail }]) => {
      if (sn === "torpidity") return acc;
      else return acc + levelDetail.wild + levelDetail.mut + levelDetail.dom;
    }, 0);
  const calcMeanWildLevel = (obj: Obj) =>
    Object.entries(obj).reduce((acc, [sn, { levelDetail }]) => {
      if (sn === "torpidity") return acc;
      else return acc + levelDetail.wild;
    }, 0) /
    Object.entries(obj).reduce((acc, [sn, { levelDetail }]) => {
      if (sn === "torpidity") return acc;
      else if (levelDetail.wild > 0) return acc + 1;
      else return acc;
    }, 0);
  const getWildLevel = (obj: Obj) =>
    Object.entries(obj)
      .filter(([sn]) => sn !== "torpidity")
      .map(([, { levelDetail }]) => levelDetail.wild);

  objList.sort((a, b) => {
    const aDiff = calcTLDiff(a);
    const bDiff = calcTLDiff(b);
    return Math.abs(aDiff) - Math.abs(bDiff);
  });

  // console.log("objList[0]", objList[0]);
  // console.log("objList[1]", objList[1]);

  // console.log(
  //   objList.map((a) => {
  //     const aDiff =
  //       ip.totalLevel -
  //       1 -
  //       Object.entries(a).reduce((acc, [sn, { levelDetail }]) => {
  //         if (sn === "torpidity") return acc;
  //         else
  //           return acc + levelDetail.wild + levelDetail.mut + levelDetail.dom;
  //       }, 0);
  //     return aDiff;
  //   }),
  // );

  const first = objList[0];
  if (!first) throw new Error();
  const d = calcTLDiff(first);
  const f = objList.filter((obj) => d === calcTLDiff(obj));

  const bufD = Number.MAX_SAFE_INTEGER;
  let bufO: Obj | null = null;
  for (const o of f) {
    const mwl = calcMeanWildLevel(o);
    const tmpD = getWildLevel(o).reduce((_acc, v) => Math.abs(mwl - v), 0);
    if (tmpD < bufD) {
      bufO = o;
    }
  }
  if (!bufO) throw new Error();
  const levels = Object.fromEntries(
    Object.entries(bufO).map(([sn, { levelDetail }]) => [sn, levelDetail]),
  );
  StatsNames.map((sn) => (meta.statsMeta[sn] = bufO[sn].statsMetaDetail));
  const tmpTotalLevelDiff = ip.totalLevel - 1 - sumLevels(levels);
  if (tmpTotalLevelDiff) meta.totalLevelDiff = tmpTotalLevelDiff;
  return [levels, meta];
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
