import * as v from "valibot";
import {
  type CalculateLevelInputPack,
  type CalculateValueInputPack,
  DEFAULT_STAT_IMPRINT_MULTIPLIER,
  DEFAULT_TBHM,
  type Imprinting,
  type LevelDetail,
  type LevelDetailIn,
  type Levels,
  LevelsSchema,
  type Settings,
  type Species,
  type SpeciesStat,
  type StatMultiplierItem,
  type Stats,
  type TameEffectiveness,
  type Values,
  ValuesSchema,
} from "./types/index.js";
import { type StatsName, StatsNames } from "./types/stats-name.js";

// テイム後のレベル計算では刷り込みボーナスなしで計算する。
const DOM_IMP = 0 as Imprinting;

// ブリはテイム効果1で計算する。
const BRED_TE = 1 as TameEffectiveness;

export function calculateValueController(ip: CalculateValueInputPack): Values {
  switch (ip.type) {
    case "wild": {
      return calculateValueWild(ip);
    }
    case "dom": {
      return calculateValueDom({ ...ip, imprinting: DOM_IMP });
    }
    case "bred": {
      return calculateValueDom({
        ...ip,
        tameEffectiveness: BRED_TE,
      });
    }
    default: {
      throw new Error(`invalid type: ${ip.type}`);
    }
  }
}

function calculateValueWild(ip: CalculateValueInputPack): Values {
  return v.parse(
    ValuesSchema,
    Object.fromEntries(
      StatsNames.map((sn) => [
        sn,
        round(
          cVw(
            ip.levels[sn],
            ip.species.stats[sn],
            ip.settings.statMultipliers[sn],
          ),
          sn,
        ),
      ]),
    ),
  );
}

function calculateValueDom(ip: CalculateValueInputPack): Values {
  return v.parse(
    ValuesSchema,
    Object.fromEntries(
      StatsNames.map((sn) => [
        sn,
        round(
          cVpt(
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
    ),
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
  ld: LevelDetail,
  stat: Stats[StatsName],
  smi: StatMultiplierItem,
): number {
  if (!stat) return 0;
  return stat.baseValue * (1 + ld.wild * stat.incPerWildLevel * smi.IwM);
}

function cVpt(
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

  const vw = cVw(ld, stat, smi);
  const tmp1 =
    vw * tbhm * (1 + imprinting * statImprintMultiplier * settings.IBM);
  // テイム時の加算ボーナスがマイナスの時はTaM(サーバーの設定)を掛けない。
  // 公式の計算式にはないけどARKStatsExtractor/ARKBreedingStats/values/Values.cs:576行付近にコメントとして記述してある
  const addBounus =
    stat.additiveBonus > 0 ? stat.additiveBonus * smi.TaM : stat.additiveBonus;
  const tmp2 = addBounus;
  // テイム時の乗算ボーナスがマイナスの時はTmM(サーバーの設定)を掛けない。
  // 公式の計算式にはないけどARKStatsExtractor/ARKBreedingStats/values/Values.cs:580行付近にコメントとして記述してある
  const multiplicativeBonus =
    stat.multiplicativeBonus > 0
      ? stat.multiplicativeBonus * smi.TmM
      : stat.multiplicativeBonus;
  const tmp3 = 1 + te * multiplicativeBonus;
  return (tmp1 + tmp2) * tmp3;
}

export function calculateLevelController(
  ip: CalculateLevelInputPack,
): [Levels, TameEffectiveness] {
  switch (ip.type) {
    case "wild": {
      return [calculateLevelWild(ip), 0 as TameEffectiveness];
    }
    case "dom": {
      return calculateLevelDom({ ...ip, imprinting: DOM_IMP });
    }
    case "bred": {
      return calculateLevelBred(ip);
    }
    default: {
      throw new Error(`invalid type: ${ip.type}`);
    }
  }
}

function calculateLevelWild(ip: CalculateLevelInputPack): Levels {
  const result = Object.fromEntries(StatsNames.map((sn) => [sn, cLw(sn, ip)]));
  return toLevels("calculateLevelWild", result, ip);
}

function calculateLevelDom(
  ip: CalculateLevelInputPack,
): [Levels, TameEffectiveness] {
  let bufError = Number.MAX_SAFE_INTEGER;
  let bufLevels: Levels | null = null;
  let bufTe: TameEffectiveness | null = null;
  for (let te = 0; te <= 100; te += 1) {
    const teParsent = te / 100;
    const tmp = calculateLevelDomCore(teParsent as TameEffectiveness, ip);
    const error = sumError(tmp);
    if (error <= bufError) {
      bufError = error;
      bufLevels = tmp;
      bufTe = teParsent as TameEffectiveness;
    }
  }
  if (!bufLevels || !bufTe) throw new Error("calculateLevelDomがなんかへん");
  return [bufLevels, bufTe];
}

function calculateLevelBred(
  ip: CalculateLevelInputPack,
): [Levels, TameEffectiveness] {
  return [calculateLevelDomCore(BRED_TE, ip), BRED_TE];
}

function sumError(levels: Levels): number {
  return (
    (levels.health.error ?? 0) +
    (levels.stamina.error ?? 0) +
    (levels.oxygen.error ?? 0) +
    (levels.food.error ?? 0) +
    (levels.water.error ?? 0) +
    (levels.temperature.error ?? 0) +
    (levels.weight.error ?? 0) +
    (levels.meleeDamageMultiplier.error ?? 0) +
    (levels.speedMultiplier.error ?? 0) +
    (levels.temperatureFortitude.error ?? 0) +
    (levels.craftingSpeedMultiplier.error ?? 0) +
    (levels.torpidity.error ?? 0)
  );
}

function calculateLevelDomCore(
  te: TameEffectiveness,
  ip: CalculateLevelInputPack,
): Levels {
  const result = Object.fromEntries(
    StatsNames.map((sn) => [sn, cLpt(sn, te, ip)]),
  );
  return toLevels("calculateLevelDomCore", result, ip);
}

const MAX_LEVEL = 500; // とりあえずレベル500まで計算する。これ以上は現実的に存在しないと思うので。

function cLw(sn: StatsName, ip: CalculateLevelInputPack): LevelDetailIn {
  const stat = ip.species.stats[sn];
  const value = ip.values[sn];
  if (!stat || stat.incPerWildLevel <= 0 || value <= 0)
    return { wild: 0, error: null };
  let bufVw = 0;
  for (let level = 0; level <= MAX_LEVEL; level++) {
    const tmpVw = round(
      cVw(
        { wild: level },
        ip.species.stats[sn],
        ip.settings.statMultipliers[sn],
      ),
      sn,
    );
    if (tmpVw === value) {
      return { wild: level, error: null };
    } else if (tmpVw > value) {
      const bufDiff = calculateError(value, bufVw, stat);
      const tmpDiff = calculateError(value, tmpVw, stat);
      if (bufDiff < tmpDiff) {
        return { wild: level - 1, error: bufDiff };
      } else {
        return { wild: level, error: tmpDiff };
      }
    }
    bufVw = tmpVw;
  }
  throw new Error(
    `error in cLw: species name: ${ip.species.name}, stats name: ${sn}`,
    { cause: ip },
  );
}

function cLpt(
  sn: StatsName,
  te: TameEffectiveness,
  ip: CalculateLevelInputPack,
): LevelDetailIn {
  const stat = ip.species.stats[sn];
  const value = ip.values[sn];
  if (!stat || stat.incPerWildLevel <= 0 || value <= 0)
    return { wild: 0, error: null };
  let bufVpt = 0;
  for (let level = 0; level <= MAX_LEVEL; level++) {
    const tmpVpt = round(
      cVpt(sn, { wild: level }, te, ip.imprinting, ip.species, ip.settings),
      sn,
    );
    if (tmpVpt === value) {
      return { wild: level, error: null };
    } else if (tmpVpt > value) {
      const bufDiff = calculateError(value, bufVpt, stat);
      const tmpDiff = calculateError(value, tmpVpt, stat);
      if (bufDiff < tmpDiff) {
        return { wild: level - 1, error: bufDiff };
      } else {
        return { wild: level, error: tmpDiff };
      }
    }
    bufVpt = tmpVpt;
  }
  throw new Error(
    `error in cLpt: species name: ${ip.species.name}, stats name: ${sn}`,
    { cause: ip },
  );
}

function calculateError(
  except: number,
  actual: number,
  stat: SpeciesStat,
): number {
  return Math.abs(except - actual) / stat.baseValue;
}

function toLevels(
  fn: string,
  result: unknown,
  ip: CalculateLevelInputPack,
): Levels {
  return v.parse(
    v.message(
      LevelsSchema,
      `error in ${fn}: result: ${JSON.stringify(result)}, ip: ${JSON.stringify(ip)}`,
    ),
    result,
  );
}
