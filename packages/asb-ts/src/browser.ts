import { cropOcrImages } from "./asb/ocr/crop-image.browser.js";
import { calcCropRects } from "./asb/ocr/crop-rect.js";
import {
  extractOcrPromiseTexts,
  extractOcrTexts,
} from "./asb/ocr/extract-text.js";
import { normalizeTexts } from "./asb/ocr/normalize.js";
import {
  type ASBResult,
  DEFAULT_CROP_RECT_OPTION,
  DEFAULT_PADDING,
  DEFAULT_SCALE,
  DEFAULT_THRESHOLD,
  type ExtractTextsOutput,
  type OcrCroppedImageRecordBrowser,
  type OcrQueueManager,
  toASBResultFailure,
} from "./common.js";

export * from "./common.js";

export type ExtractTextsOutputBrowser =
  ExtractTextsOutput<OcrCroppedImageRecordBrowser>;

export function extractTexts(
  manager: OcrQueueManager,
  source: OffscreenCanvas,
  ymNL = DEFAULT_CROP_RECT_OPTION.ymNL,
  dlmNL = DEFAULT_CROP_RECT_OPTION.dlmNL,
  drmNL = DEFAULT_CROP_RECT_OPTION.drmNL,
  dhmNL = DEFAULT_CROP_RECT_OPTION.dhmNL,
  ymS = DEFAULT_CROP_RECT_OPTION.ymS,
  dlmS = DEFAULT_CROP_RECT_OPTION.dlmS,
  drmS = DEFAULT_CROP_RECT_OPTION.drmS,
  dhmS = DEFAULT_CROP_RECT_OPTION.dhmS,
  threshold = DEFAULT_THRESHOLD,
  scale = DEFAULT_SCALE,
  padding = DEFAULT_PADDING,
): ASBResult<ExtractTextsOutputBrowser> {
  try {
    const sourceCanvas = Promise.resolve(source);

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
      ([sc, cr]) => cropOcrImages(sc, threshold, cr, scale, padding),
    );
    const extractedTexs = croppedImages
      .then((ci) => extractOcrPromiseTexts(manager, ci))
      .then(extractOcrTexts);

    const normalized = extractedTexs.then((extractedTexs) =>
      normalizeTexts(extractedTexs),
    );

    return {
      isSuccess: true,
      result: {
        cropRects,
        croppedImages,
        extractedTexs,
        normalized,
      },
    };
  } catch (e) {
    return toASBResultFailure(e);
  }
}
