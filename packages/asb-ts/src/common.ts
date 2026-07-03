import * as v from "valibot";
import {
  calculateLevelController,
  calculateValueController,
} from "./asb/calculator.js";
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
  DEFAULT_SETTINGS,
  isASBTSErrorCommon,
  type OcrCroppedImageRecordBrowser,
  type OcrCroppedImageRecordNode,
  type OcrCropRectRecord,
  type OcrExtractedTextRecord,
  type Settings,
  SettingsSchema,
} from "./asb/types/index.js";
import type { normalizeTexts } from "./common.js";

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
export function toASBResultFailure(e: any): ASBResultFailure {
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

export type ExtractTextsOutput<
  T extends OcrCroppedImageRecordBrowser | OcrCroppedImageRecordNode,
> = {
  cropRects: Promise<OcrCropRectRecord>;
  croppedImages: Promise<T>;
  extractedTexs: Promise<OcrExtractedTextRecord>;
  normalized: Promise<ReturnType<typeof normalizeTexts>>;
};
