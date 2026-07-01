import * as v from "valibot";
import {
  calculateLevelController,
  calculateValueController,
} from "./asb/calculator.js";
import { cropOcrImages } from "./asb/ocr/crop-image.js";
import { calcCropRects } from "./asb/ocr/crop-rect.js";
import {
  extractOcrPromiseTexts,
  extractOcrTexts,
} from "./asb/ocr/extract-text.js";
import type { OcrQueueManager } from "./asb/ocr/manager.js";
import {
  type ASBTSErrorCommonObject,
  type ASBTSErrorObject,
  type ASBTSErrorUnknownObject,
  type ASBTSErrorValibotObject,
  CalculateLevelInputPackSchema,
  type CalculateLevelInputPackUnsafe,
  type CalculateLevelOutputPack,
  CalculateValueInputPackSchema,
  type CalculateValueInputPackUnsafe,
  type CalculateValueOutputPack,
  DEFAULT_CROP_RECT_OPTION,
  DEFAULT_SETTINGS,
  DEFAULT_THRESHOLD,
  isASBTSErrorCommon,
  type OcrCroppedImageRecord,
  type OcrCropRectRecord,
  type OcrExtractedTextRecord,
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

export type ASBResult<T> = ASBResultSuccess<T> | ASBResultFailure;
export type ASBResultSuccess<T> = {
  isSuccess: true;
  result: T;
};
export type ASBResultFailure = {
  isSuccess: false;
  error: ASBTSErrorObject;
};

// biome-ignore lint/suspicious/noExplicitAny: 型判定のためなんでも受け取れるようにanyにする
function toASBResultFailure(e: any): ASBResultFailure {
  if (v.isValiError(e)) {
    return {
      isSuccess: false,
      error: {
        _tag: "ASBTSError",
        type: "valibot",
        flatError: v.flatten(e.issues),
        valiError: e,
      } satisfies ASBTSErrorValibotObject,
    };
  } else if (isASBTSErrorCommon(e)) {
    return {
      isSuccess: false,
      error: {
        ...e,
      } satisfies ASBTSErrorCommonObject,
    };
  } else {
    return {
      isSuccess: false,
      error: {
        _tag: "ASBTSError",
        type: "unknown",
        error: e,
      } satisfies ASBTSErrorUnknownObject,
    };
  }
}

export function calculateValue(
  ip: CalculateValueInputPackUnsafe,
): ASBResult<CalculateValueOutputPack> {
  try {
    return {
      isSuccess: true,
      result: calculateValueController(
        v.parse(CalculateValueInputPackSchema, ip),
      ),
    };
  } catch (e) {
    return toASBResultFailure(e);
  }
}

import { toOcrCanvas } from "./asb/ocr/canvas.js";
import { normalizeTexts } from "./asb/ocr/normalize.js";
export function calculateLevel(
  ip: CalculateLevelInputPackUnsafe,
): ASBResult<CalculateLevelOutputPack> {
  try {
    return {
      isSuccess: true,
      result: calculateLevelController(
        v.parse(CalculateLevelInputPackSchema, ip),
      ),
    };
  } catch (e) {
    return toASBResultFailure(e);
  }
}

export type ExtractTextsOutput = {
  cropRects: Promise<OcrCropRectRecord>;
  croppedImages: Promise<OcrCroppedImageRecord>;
  extractedTexs: Promise<OcrExtractedTextRecord>;
  result: Promise<ReturnType<typeof normalizeTexts>>;
};

export function extractTexts(
  manager: OcrQueueManager,
  sourceFile: File,
  ymNL = DEFAULT_CROP_RECT_OPTION.ymNL,
  dlmNL = DEFAULT_CROP_RECT_OPTION.dlmNL,
  drmNL = DEFAULT_CROP_RECT_OPTION.drmNL,
  dhmNL = DEFAULT_CROP_RECT_OPTION.dhmNL,
  ymS = DEFAULT_CROP_RECT_OPTION.ymS,
  dlmS = DEFAULT_CROP_RECT_OPTION.dlmS,
  drmS = DEFAULT_CROP_RECT_OPTION.drmS,
  dhmS = DEFAULT_CROP_RECT_OPTION.dhmS,
  threshold = DEFAULT_THRESHOLD,
): ASBResult<ExtractTextsOutput> {
  try {
    const sourceCanvas = toOcrCanvas(sourceFile);

    const cropRects = sourceCanvas.then((sc) =>
      calcCropRects(
        sc.width,
        sc.height,
        ymNL,
        dlmNL,
        drmNL,
        dhmNL,
        ymS,
        dlmS,
        drmS,
        dhmS,
      ),
    );
    const croppedImages = Promise.all([sourceCanvas, cropRects]).then(
      ([sc, cr]) => cropOcrImages(sc, threshold, cr),
    );
    const extractedTexs = croppedImages
      .then((ci) => extractOcrPromiseTexts(manager, ci))
      .then(extractOcrTexts);

    const result = extractedTexs.then((extractedTexs) =>
      normalizeTexts(extractedTexs),
    );

    return {
      isSuccess: true,
      result: {
        cropRects,
        croppedImages,
        extractedTexs,
        result,
      },
    };
  } catch (e) {
    return toASBResultFailure(e);
  }
}
