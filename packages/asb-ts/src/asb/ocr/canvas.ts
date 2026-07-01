import {
  type Canvas,
  createCanvas,
  loadImage,
  type SKRSContext2D,
} from "@napi-rs/canvas";
import { ASBTSErrorCommon } from "../../index.js";

export function createOcrCanvas(
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

export async function toOcrCanvas(file: File) {
  return file
    .arrayBuffer()
    .then((buffer) => loadImage(buffer))
    .then((image) => {
      const [canvas, ctx] = createOcrCanvas(image.width, image.height);
      ctx.drawImage(image, 0, 0);
      return canvas;
    });
}
