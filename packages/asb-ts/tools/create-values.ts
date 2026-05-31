/*
    このファイルは、ARKStatsExtractorr から種族値を抽出するためのツールです。
    指定したパスのjsonファイルを読み込み、必要な情報だけを抜き出し、values.ts を作成します。
*/

import fs from "node:fs";
import * as v from "valibot";
import {
  type ValueSpecies,
  ValueSpeciesSchema,
} from "../src/asb/migration/values/types.js";

/**
 * この関数は、指定したパスのjsonファイルを読み込み、必要な情報だけを抜き出し、ValueSpecies[] 型の配列を返します。
 * 読み込むjsonファイルには以下のような構造が必要です。
 * {
 *   "species": [
 *     {
 *       "name": "SpeciesName",
 *       "fullStatsRaw": [
 *         [0, 0, 0, 0, 0, 0],
 *         [0, 0, 0, 0, 0, 0],
 *         null,
 *         ...
 *       ]
 *     },
 *     ...
 *   ]
 * }
 * @param path jsonファイルのパス
 */
function extractValues(path: string): ValueSpecies[] {
  // ファイルの読み込み
  const rawData = fs.readFileSync(path, "utf-8");
  const data = JSON.parse(rawData);

  // species フィールドから ValueSpecies 配列を作成
  const speciesList = (data.species as []).map((item) =>
    v.parse(ValueSpeciesSchema, item),
  );

  return speciesList;
}

/**
 * この関数は、Values[] 型の配列を受け取り、values.ts を作成します。
 * 作成される values.ts には、以下のような内容が含まれます。
 * export const values: Values[] = [
 *   {
 *     name: "SpeciesName",
 *     fullStatsRaw: [
 *       [0, 0, 0, 0, 0, 0],
 *       [0, 0, 0, 0, 0, 0],
 *       null,
 *       ...
 *     ]
 *   },
 *   ...
 * ] as const;
 * @param species 種族値の配列
 * @param outputPath 出力ファイルのパス
 */
function createConstTs(values: ValueSpecies[], outputPath: string) {
  // values.ts の内容を作成
  const content = `
// このファイルは機械的に出力されました。

  import type { ValueSpecies } from "./types.js";

  export const VALUE_SPECIES: ValueSpecies[] = [\n  ${values
    .map((v) => {
      const field = [];
      if (v.name) field.push(`name:"${v.name}"`);
      field.push(`blueprintPath:"${v.blueprintPath}"`);
      if (v.variants) field.push(`variants:${JSON.stringify(v.variants)}`);
      if (v.fullStatsRaw)
        field.push(`fullStatsRaw: ${JSON.stringify(v.fullStatsRaw)}`);
      if (v.statImprintMult)
        field.push(`statImprintMult: ${JSON.stringify(v.statImprintMult)}`);
      if (v.mutationMult)
        field.push(`mutationMult: ${JSON.stringify(v.mutationMult)}`);
      if (v.TamedBaseHealthMultiplier)
        field.push(`TamedBaseHealthMultiplier: ${v.TamedBaseHealthMultiplier}`);

      return `{${field.join(",")}},`;
    })
    .join("\n")
    .trim()}\n] as const;
    `;

  // ファイルを出力
  fs.writeFileSync(outputPath, content, "utf-8");
}

function main() {
  const species = extractValues(
    "./ARKStatsExtractor/ARKBreedingStats/json/values/values.json",
  );
  createConstTs(species, "./src/asb/migration/values/values.ts");

  const ASA_species = extractValues(
    "./ARKStatsExtractor/ARKBreedingStats/json/values/ASA-values.json",
  );
  createConstTs(ASA_species, "./src/asb/migration/values/ASA-values.ts");
}

main();
