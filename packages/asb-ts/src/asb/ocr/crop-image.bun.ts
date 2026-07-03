import {
  type Canvas,
  createCanvas,
  loadImage,
  type SKRSContext2D,
} from "@napi-rs/canvas";
import * as R from "remeda";
import { ASBTSErrorCommon } from "../types/error.js";
import {
  type CroppedImageRecordBun,
  type CropRect,
  OCR_LABELS,
  type OcrCroppedImageRecordBun,
  type OcrCropRectRecord,
} from "../types/index.js";
import { getTargetWH, setImageData } from "./crop-image.core.js";

function createOcrCanvas(
  width: number,
  height: number,
): [canvas: Canvas, ctx: SKRSContext2D] {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new ASBTSErrorCommon(
      "Canvas要素のコンテキスト取得に失敗しました。",
      "createOcrCanvas",
      { width, height },
    );
  }
  return [canvas, ctx];
}

export async function toOcrCanvas(source: Blob): Promise<Canvas> {
  return source
    .bytes()
    .then((bytes) => loadImage(bytes))
    .then((image) => {
      const [canvas, ctx] = createOcrCanvas(image.width, image.height);
      ctx.drawImage(image, 0, 0);
      return canvas;
    });
}

async function toImageLike(canvas: Canvas): Promise<Buffer> {
  return canvas.encode("png");
}

export async function cropOcrImages(
  source: Canvas,
  threshold: number,
  cropRects: OcrCropRectRecord,
  scale: number,
  padding: number,
): Promise<OcrCroppedImageRecordBun> {
  return Promise.all(
    R.pipe(
      cropRects,
      R.entries(),
      R.map(async ([label, cropRect]) => {
        const croppedImages = await cropImages(
          source,
          threshold,
          cropRect,
          scale,
          padding,
        );
        return [label, croppedImages] as const;
      }),
    ),
  ).then((croppedImagesEntries) =>
    R.fromKeys(OCR_LABELS, (ol) => {
      const found = croppedImagesEntries.find(([label]) => label === ol)?.[1];
      if (!found) {
        throw new ASBTSErrorCommon(
          "OCRラベルに対応する切り取り画像が見つかりませんでした。",
          "cropOcrImages",
          { source, threshold, cropRects },
        );
      }
      return found;
    }),
  );
}

async function cropImages(
  source: Canvas,
  threshold: number,
  cropRect: CropRect,
  scale: number,
  padding: number,
): Promise<CroppedImageRecordBun> {
  const { x, y, width, height } = cropRect;

  const { targetWidth, targetHeight } = getTargetWH(cropRect, scale, padding);

  const [original, oCtx] = createOcrCanvas(targetWidth, targetHeight); // 切り取り用 (original)
  const [grayscale, gCtx] = createOcrCanvas(targetWidth, targetHeight); // グレースケール用
  const [binary, bCtx] = createOcrCanvas(targetWidth, targetHeight); // 二値化用

  // 塗りつぶして余白にする
  oCtx.fillStyle = "#000000";
  oCtx.fillRect(0, 0, targetWidth, targetHeight);

  // 2. 元のCanvasから指定された範囲を「a (original)」に切り取って描画
  oCtx.drawImage(
    source,
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
  const oImgData = oCtx.getImageData(0, 0, targetWidth, targetHeight);
  const oData = oImgData.data;

  // 4. グレースケール用と二値化用の ImageData 領域を新しく用意
  const grayImgData = gCtx.createImageData(targetWidth, targetHeight);
  const binaryImgData = bCtx.createImageData(targetWidth, targetHeight);

  const gData = grayImgData.data;
  const bData = binaryImgData.data;

  setImageData(oData, gData, bData, threshold, cropRect);

  // 計算したピクセルデータをそれぞれのCanvasに書き戻す
  gCtx.putImageData(grayImgData, 0, 0);
  bCtx.putImageData(binaryImgData, 0, 0);

  return Promise.all([
    toImageLike(original),
    toImageLike(grayscale),
    toImageLike(binary),
  ]).then(([originalBlob, grayscaleBlob, binaryBlob]) => ({
    original: originalBlob,
    grayscale: grayscaleBlob,
    binary: binaryBlob,
  }));
}
