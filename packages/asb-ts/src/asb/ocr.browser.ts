import {
  type ImgPack_Browser,
  type ImgPacks_Browser,
  OCR_LABELS,
  type Region,
  type Regions,
} from "./types/index.js";

export function getImgPacks(
  sourceImg: HTMLImageElement,
  threshold: number,
  regions: Regions,
): ImgPacks_Browser {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error();
  canvas.width = sourceImg.width;
  canvas.height = sourceImg.height;
  ctx.drawImage(sourceImg, 0, 0);

  return Object.fromEntries(
    OCR_LABELS.map((label) => [
      label,
      getImgPack(canvas, threshold, regions[label]),
    ]),
  ) as ImgPacks_Browser;
}

export function getImgPack(
  sourceCanvas: HTMLCanvasElement,
  threshold: number,
  { x, y, width, height }: Region,
): ImgPack_Browser {
  // 1. 各Canvas要素と2Dコンテキストを作成する共通処理
  const createTargetCanvas = (): [
    HTMLCanvasElement,
    CanvasRenderingContext2D,
  ] => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas のctx を取得できませんでした。");
    return [canvas, ctx];
  };

  const [original, oCtx] = createTargetCanvas(); // 切り取り用 (original)
  const [grayscale, gCtx] = createTargetCanvas(); // グレースケール用
  const [binary, bCtx] = createTargetCanvas(); // 二値化用

  // 2. 元のCanvasから指定された範囲を「a (original)」に切り取って描画
  oCtx.drawImage(sourceCanvas, x, y, width, height, 0, 0, width, height);

  // 3. 画像処理のために「sourceCanvas」のピクセルデータを取得
  const imgData = oCtx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 4. グレースケール用と二値化用の ImageData 領域を新しく用意
  const grayImgData = gCtx.createImageData(width, height);
  const binaryImgData = bCtx.createImageData(width, height);

  const grayData = grayImgData.data;
  const binaryData = binaryImgData.data;

  // 5. ピクセルデータをループ処理（1回のループで両方計算して高速化）
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]; // 赤
    const g = data[i + 1]; // 緑
    const b = data[i + 2]; // 青
    const orininalVal = data[i + 3]; // 透明度

    if (
      r === undefined ||
      g === undefined ||
      b === undefined ||
      orininalVal === undefined
    ) {
      throw new Error("なんか変");
    }

    // 輝度（グレースケール値）の計算 (BT.601)
    const v = 0.299 * r + 0.587 * g + 0.114 * b;

    // グレースケールデータの書き込み
    grayData[i] = v;
    grayData[i + 1] = v;
    grayData[i + 2] = v;
    grayData[i + 3] = orininalVal; // 元の透明度を維持

    // 二値化データの書き込み（しきい値より大きければ白:255、小さければ黒:0）
    const bVal = v >= threshold ? 255 : 0;
    binaryData[i] = bVal;
    binaryData[i + 1] = bVal;
    binaryData[i + 2] = bVal;
    binaryData[i + 3] = orininalVal; // 元の透明度を維持
  }

  // 6. 計算したピクセルデータをそれぞれのCanvasに書き戻す
  gCtx.putImageData(grayImgData, 0, 0);
  bCtx.putImageData(binaryImgData, 0, 0);

  // 7. 指定されたフォーマットのオブジェクトで返す
  return {
    original,
    grayscale,
    binary,
  };
}
