import * as R from "remeda";
import { ASBTSErrorCommon } from "../types/error.js";
import type {
  CroppedImageRecord,
  CropRect,
  OcrCroppedImageRecord,
  OcrCropRectRecord,
} from "../types/index.js";

export function cropOcrImages(
  sourceImg: HTMLImageElement,
  threshold: number,
  cropRects: OcrCropRectRecord,
): OcrCroppedImageRecord {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new ASBTSErrorCommon(
      "Canvas要素のコンテキスト取得に失敗しました。",
      "cropOcrImages",
      { sourceImg, threshold, cropRects },
    );
  }
  canvas.width = sourceImg.width;
  canvas.height = sourceImg.height;
  ctx.drawImage(sourceImg, 0, 0);

  return R.mapValues(cropRects, (value) =>
    cropImages(canvas, threshold, value),
  );
}

function cropImages(
  sourceCanvas: HTMLCanvasElement,
  threshold: number,
  cropRect: CropRect,
): CroppedImageRecord {
  const { x, y, width, height } = cropRect;
  const scale = 3; //拡大倍率
  const padding = 20; //余白

  const targetWidth = width * scale + padding * 2;
  const targetHeight = height * scale + padding * 2;
  // 1. 各Canvas要素と2Dコンテキストを作成する共通処理
  const createTargetCanvas = (): [
    HTMLCanvasElement,
    CanvasRenderingContext2D,
  ] => {
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new ASBTSErrorCommon(
        "Canvas要素のコンテキスト取得に失敗しました。",
        "cropImages",
        { sourceCanvas, threshold, cropRect },
      );
    }
    return [canvas, ctx];
  };

  const [original, oCtx] = createTargetCanvas(); // 切り取り用 (original)
  const [grayscale, gCtx] = createTargetCanvas(); // グレースケール用
  const [binary, bCtx] = createTargetCanvas(); // 二値化用

  // 塗りつぶして余白にする
  oCtx.fillStyle = "#000000";
  oCtx.fillRect(0, 0, targetWidth, targetHeight);

  // 2. 元のCanvasから指定された範囲を「a (original)」に切り取って描画
  oCtx.drawImage(
    sourceCanvas,
    x,
    y,
    // 元画像からの切り出し範囲
    width,
    height,
    // 描画位置（余白の内側）
    padding,
    padding,
    // 3倍に拡大
    width * scale,
    height * scale,
  );

  // 3. 画像処理のために「sourceCanvas」のピクセルデータを取得
  const imgData = oCtx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;

  // 4. グレースケール用と二値化用の ImageData 領域を新しく用意
  const grayImgData = gCtx.createImageData(targetWidth, targetHeight);
  const binaryImgData = bCtx.createImageData(targetWidth, targetHeight);

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
      throw new ASBTSErrorCommon(
        "Canvas要素のコンテキスト取得に失敗しました。",
        "cropImages",
        { sourceCanvas, threshold, cropRect },
        { dataLength: data.length, r, g, b, orininalVal },
      );
    }

    // 輝度（グレースケール値）の計算 (BT.601)
    const tmpV = 0.299 * r + 0.587 * g + 0.114 * b;

    // 白黒反転させる
    const v = 255 - tmpV;

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
