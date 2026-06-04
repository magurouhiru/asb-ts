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
  type StatsName,
  StatsNames,
  type TameEffectiveness,
  TameEffectivenessSchema,
  TE_MAX,
  type Type,
  ValuesSchema,
  WILD_TE,
} from "./types/index.js";

export function calculateValueController(
  ip: CalculateValueInputPack,
): CalculateValueOutputPack {
  let result: { [k: string]: number } | null = null;
  const meta = createMeta();
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

  const parsed = v.safeParse(ValuesSchema, result);
  if (parsed.success) {
    setEqualWildMutationRates(ip.species, meta);
    return { status: "success", values: parsed.output, meta };
  } else {
    return toOutputPackFailure("internal_error", parsed.issues);
  }
}

function calculateValueWild(
  ip: Extract<CalculateValueInputPack, { type: "wild" }>,
) {
  return Object.fromEntries(
    StatsNames.map((sn) => [
      sn,
      round(
        cVw(
          ip.type,
          ip.levels[sn],
          ip.species.stats[sn],
          (ip.species.mutationMultiplier ?? DEFAULT_MUTATION_MULTIPLIER)[sn],
          ip.settings.statMultipliers[sn],
        ),
        sn,
      ),
    ]),
  );
}

function calculateValueDomBred(
  ip: Exclude<CalculateValueInputPack, { type: "wild" }>,
) {
  return Object.fromEntries(
    StatsNames.map((sn) => [
      sn,
      round(
        cV(
          ip.type,
          sn,
          ip.levels[sn],
          ip.tameEffectiveness,
          ip.imprinting,
          ip.species,
          ip.settings,
        ),
        sn,
      ),
    ]),
  );
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
  ld: LevelDetail,
  stat: Stats[StatsName],
  mm: MutationMultiplier[StatsName],
  smi: StatMultiplierItem,
): number {
  if (!stat) return 0;
  // 公式wikiの計算式にはない？認識だが、変異のレベルは補正があれば補正をかけてLwと同じように計算する
  // ARKStatsExtractor/ARKBreedingStats/values/Values.cs:594行付近と
  // ARKStatsExtractor/ARKBreedingStats/Stats.cs:58行付近を参照
  // 野生で変異はしないので野生では0にする
  const adjustedMutLevel = type === "wild" ? 0 : ld.mut * mm;
  return (
    stat.baseValue *
    (1 + (ld.wild + adjustedMutLevel) * stat.incPerWildLevel * smi.IwM)
  );
}

function cVpt(
  type: Exclude<Type, "wild">,
  sn: StatsName,
  ld: LevelDetail,
  te: TameEffectiveness,
  imprinting: Imprinting,
  species: Species,
  settings: Settings,
): number {
  const stat = species.stats[sn];
  if (!stat) return 0;
  const tbhm =
    sn === "health"
      ? (species.tamedBaseHealthMultiplier ?? DEFAULT_TBHM)
      : DEFAULT_TBHM;
  const statImprintMultiplier =
    species.statImprintMultiplier?.[sn] ?? DEFAULT_STAT_IMPRINT_MULTIPLIER[sn];
  const smi = settings.statMultipliers[sn];
  const mm = (species.mutationMultiplier ?? DEFAULT_MUTATION_MULTIPLIER)[sn];

  const vw = cVw(type, ld, stat, mm, smi);
  // テイム時の加算ボーナスがマイナスの時はTaM(サーバーの設定)を掛けない。
  // 公式の計算式にはないけどARKStatsExtractor/ARKBreedingStats/values/Values.cs:576行付近にコメントとして記述してある
  const addBounus =
    stat.additiveBonus > 0 ? stat.additiveBonus * smi.TaM : stat.additiveBonus;

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
  type: Exclude<Type, "wild">,
  sn: StatsName,
  ld: LevelDetail,
  te: TameEffectiveness,
  imprinting: Imprinting,
  species: Species,
  settings: Settings,
): number {
  const stat = species.stats[sn];
  if (!stat) return 0;
  const vpt = cVpt(type, sn, ld, te, imprinting, species, settings);

  return (
    vpt * (1 + ld.dom * stat.incPerDomLevel * settings.statMultipliers[sn].IdM)
  );
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
        [levels, meta] = calculateLevelWild(ip);
        te = WILD_TE;
        break;
      }
      case "dom": {
        [levels, te, meta] = calculateLevelDom(ip);
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
      setEqualWildMutationRates(ip.species, meta);
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
    if (tmpSumDiff <= buffDiff) {
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
  const result = StatsNames.map((sn) => {
    const [ld, smd] = cLpt(sn, te, ip);
    return { sn, ld, smd };
  });
  const levels = Object.fromEntries(result.map(({ sn, ld }) => [sn, ld]));
  result.forEach(({ sn, smd }) => {
    if (smd) meta.statsMeta[sn] = smd;
  });
  return [levels, meta];
}

// とりあえずレベル100まで計算する。これ以上は現実的に存在しないと思うので。
const TARGET_LEVEL_DETAIL_LIST_SIZE = 100;
const TARGET_LEVEL_RANGE = Array.from(
  { length: TARGET_LEVEL_DETAIL_LIST_SIZE + 1 },
  (_, i) => i,
);

const TARGET_LEVEL_DETAIL_LIST_WILD = TARGET_LEVEL_RANGE.map((i) =>
  v.parse(LevelDetailSchema, { wild: i, mut: 0, dom: 0 }),
);
const TARGET_LEVEL_DETAIL_LIST_WILD_DOM = TARGET_LEVEL_RANGE.flatMap((i) =>
  TARGET_LEVEL_RANGE.map((k) =>
    v.parse(LevelDetailSchema, { wild: i, mut: 0, dom: k }),
  ),
);
const TARGET_LEVEL_DETAIL_LIST_WILD_MUT_DOM = TARGET_LEVEL_RANGE.flatMap((i) =>
  TARGET_LEVEL_RANGE.flatMap((j) =>
    TARGET_LEVEL_RANGE.map((k) =>
      v.parse(LevelDetailSchema, { wild: i, mut: j, dom: k }),
    ),
  ),
);

// 気絶値とりあえずレベル500まで計算する。これ以上は現実的に存在しないと思うので。
const TARGET_LEVEL_DETAIL_LIST_SIZE_TORPIDITY = 500;
const TARGET_LEVEL_RANGE_TORPIDITY = Array.from(
  { length: TARGET_LEVEL_DETAIL_LIST_SIZE_TORPIDITY + 1 },
  (_, i) => i,
);
const TARGET_LEVEL_DETAIL_LIST_WILD_TORPIDITY =
  TARGET_LEVEL_RANGE_TORPIDITY.map((i) =>
    v.parse(LevelDetailSchema, { wild: i, mut: 0, dom: 0 }),
  );

const LEVEL_DETAIL_0 = { wild: 0, mut: 0, dom: 0 } satisfies LevelDetail;

function cLw(
  sn: StatsName,
  ip: Extract<CalculateLevelInputPack, { type: "wild" }>,
): [LevelDetail, StatsMeta[StatsName]] {
  const stat = ip.species.stats[sn];
  const value = ip.values[sn];
  if (!stat || stat.incPerWildLevel <= 0 || value <= 0)
    return [LEVEL_DETAIL_0, undefined];
  let buffLd: LevelDetail | null = null;
  let buffDiff = Number.MAX_SAFE_INTEGER;
  for (const ld of sn === "torpidity"
    ? TARGET_LEVEL_DETAIL_LIST_WILD_TORPIDITY
    : TARGET_LEVEL_DETAIL_LIST_WILD) {
    const tmpVw = round(
      cVw(
        ip.type,
        ld,
        ip.species.stats[sn],
        (ip.species.mutationMultiplier ?? DEFAULT_MUTATION_MULTIPLIER)[sn],
        ip.settings.statMultipliers[sn],
      ),
      sn,
    );
    const tmpDiff = value - tmpVw;
    if (Math.abs(tmpDiff) < Math.abs(buffDiff)) {
      buffLd = ld;
      buffDiff = tmpDiff;
    }
  }
  if (buffLd === null)
    throw new Error("cLw で失敗しました。", { cause: `levels.${sn}` });
  return [buffLd, buffDiff === 0 ? undefined : { valueDiff: buffDiff }];
}

function cLpt(
  sn: StatsName,
  te: TameEffectiveness,
  ip: Exclude<CalculateLevelInputPack, { type: "wild" }>,
): [LevelDetail, StatsMeta[StatsName]] {
  const stat = ip.species.stats[sn];
  const value = ip.values[sn];
  if (!stat || stat.incPerWildLevel <= 0 || value <= 0)
    return [LEVEL_DETAIL_0, undefined];
  let buffLd: LevelDetail | null = null;
  let buffDiff = Number.MAX_SAFE_INTEGER;

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
    const tmpVpt = round(
      cVpt(ip.type, sn, ld, te, ip.imprinting, ip.species, ip.settings),
      sn,
    );
    const tmpDiff = value - tmpVpt;
    if (Math.abs(tmpDiff) < Math.abs(buffDiff)) {
      buffLd = ld;
      buffDiff = tmpDiff;
    }
  }
  if (buffLd === null)
    throw new Error("cLpt で失敗しました。", { cause: `levels.${sn}` });
  return [buffLd, { valueDiff: buffDiff }];
}

function createMeta(): Meta {
  return { statsMeta: {} };
}

function setEqualWildMutationRates(species: Species, meta: Meta) {
  const mms = species.mutationMultiplier ?? DEFAULT_MUTATION_MULTIPLIER;
  StatsNames.forEach((sn) => {
    const mm = mms[sn];
    if (mm === 1) {
      if (meta.statsMeta[sn] === undefined) {
        meta.statsMeta[sn] = {};
      }
      meta.statsMeta[sn].equalWildMutationRates = true;
    }
  });
}
