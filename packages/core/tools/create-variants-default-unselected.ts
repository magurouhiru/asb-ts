/*
    このファイルは、ARKStatsExtractorr からデフォルトで選択しないvariantsを抽出するためのツールです。
    指定したパスのtxtファイルを読み込み、必要な情報だけを抜き出し、.ts を作成します。
*/

import fs from "node:fs";

function extractValues(path: string): string[] {
  // ファイルの読み込み
  const rawData = fs.readFileSync(path, "utf-8");
  return rawData.replace(/\uFEFF/g, "").split(/\r?\n/);
}

function createConstTs(variants: string[], outputPath: string) {
  // values.ts の内容を作成
  const content = `
// このファイルは機械的に出力されました。

  import type { Species } from "../types/index.js";

  export const VARIANT_DEFAULT_UNSELECTED: string[] = ${JSON.stringify(variants)} as const;
    `;

  // ファイルを出力
  fs.writeFileSync(outputPath, content, "utf-8");
}

function main() {
  const variants = extractValues(
    "./ARKStatsExtractor/ARKBreedingStats/json/variantsDefaultUnselected.txt",
  );
  createConstTs(variants, "./src/asb/migration/variants/default-unselected.ts");
}

main();
