import { ASBTSErrorCommon } from "../types/error.js";
import type { CropRect } from "../types/index.js";

export function getTargetWH(
  cropRect: CropRect,
  scale: number,
  padding: number,
): { targetWidth: number; targetHeight: number } {
  return {
    targetWidth: Math.floor(cropRect.width * scale) + padding * 2,
    targetHeight: Math.floor(cropRect.height * scale) + padding * 2,
  };
}

export function setImageData(
  oData: Uint8ClampedArray,
  gData: Uint8ClampedArray,
  bData: Uint8ClampedArray,
  threshold: number,
  cropRect: CropRect,
) {
  // ピクセルデータをループ処理（1回のループで両方計算して高速化）
  for (let i = 0; i < oData.length; i += 4) {
    const r = oData[i]; // 赤
    const g = oData[i + 1]; // 緑
    const b = oData[i + 2]; // 青
    const orininalVal = oData[i + 3]; // 透明度

    if (
      r === undefined ||
      g === undefined ||
      b === undefined ||
      orininalVal === undefined
    ) {
      throw new ASBTSErrorCommon(
        "Canvas要素のコンテキスト取得に失敗しました。",
        "cropImages",
        { oData, gData, bData, threshold, cropRect },
      );
    }

    // 輝度（グレースケール値）の計算 (BT.601)
    const tmpV = 0.299 * r + 0.587 * g + 0.114 * b;

    // 白黒反転させる
    const v = 255 - tmpV;

    // グレースケールデータの書き込み
    gData[i] = v;
    gData[i + 1] = v;
    gData[i + 2] = v;
    gData[i + 3] = orininalVal; // 元の透明度を維持

    // 二値化データの書き込み（しきい値より大きければ白:255、小さければ黒:0）
    const bVal = v >= threshold ? 255 : 0;
    bData[i] = bVal;
    bData[i + 1] = bVal;
    bData[i + 2] = bVal;
    bData[i + 3] = orininalVal; // 元の透明度を維持
  }
}
