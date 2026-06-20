import * as v from "valibot";
import {
  calculateLevelController,
  calculateValueController,
} from "./asb/calculator.js";
import { cropOcrImages } from "./asb/ocr/crop.browser.js";
import { calcCropRects } from "./asb/ocr/crop-rect.js";
import {
  extractOcrPromiseTexts,
  extractOcrTexts,
} from "./asb/ocr/extract-text.js";
import type { OcrQueueManager } from "./asb/ocr/manager.js";
import {
  CalculateLevelInputPackSchema,
  type CalculateLevelInputPackUnsafe,
  type CalculateLevelOutputPack,
  CalculateValueInputPackSchema,
  type CalculateValueInputPackUnsafe,
  DEFAULT_CROP_RECT_OPTION,
  DEFAULT_SETTINGS,
  DEFAULT_THRESHOLD,
  type Settings,
  SettingsSchema,
} from "./asb/types/index.js";

export * from "./asb/types/index.js";

export function createSettings(settings?: Partial<Settings>): Settings {
  return v.parse(SettingsSchema, { ...DEFAULT_SETTINGS, ...settings });
}

export * from "./asb/ocr/manager.js";
export * from "./asb/ocr/normalize.js";
export { createSpeciesList } from "./asb/species.js";

export function calculateValue(ip: CalculateValueInputPackUnsafe) {
  return calculateValueController(v.parse(CalculateValueInputPackSchema, ip));
}

import { normalizeTexts } from "./asb/ocr/normalize.js";
export function calculateLevel(
  ip: CalculateLevelInputPackUnsafe,
): CalculateLevelOutputPack {
  return calculateLevelController(v.parse(CalculateLevelInputPackSchema, ip));
}

export type ExtractTextsOutput = ReturnType<typeof extractTexts>;

export function extractTexts(
  manager: OcrQueueManager,
  sourceImg: HTMLImageElement,
  ymNL = DEFAULT_CROP_RECT_OPTION.ymNL,
  dlmNL = DEFAULT_CROP_RECT_OPTION.dlmNL,
  drmNL = DEFAULT_CROP_RECT_OPTION.drmNL,
  dhmNL = DEFAULT_CROP_RECT_OPTION.dhmNL,
  ymS = DEFAULT_CROP_RECT_OPTION.ymS,
  dlmS = DEFAULT_CROP_RECT_OPTION.dlmS,
  drmS = DEFAULT_CROP_RECT_OPTION.drmS,
  dhmS = DEFAULT_CROP_RECT_OPTION.dhmS,
  threshold = DEFAULT_THRESHOLD,
) {
  const cropRects = calcCropRects(
    sourceImg.width,
    sourceImg.height,
    ymNL,
    dlmNL,
    drmNL,
    dhmNL,
    ymS,
    dlmS,
    drmS,
    dhmS,
  );
  const croppedImages = cropOcrImages(sourceImg, threshold, cropRects);
  const extractedPromiseTexs = extractOcrPromiseTexts(manager, croppedImages);

  const resultPromise = extractOcrTexts(extractedPromiseTexs).then(
    (extractedTexs) => normalizeTexts(extractedTexs),
  );

  return {
    result: {
      cropRects,
      croppedImages,
      extractedPromiseTexs,
    },
    resultPromise,
  };
}
