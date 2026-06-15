import * as R from "remeda";
import { PSM, type WorkerParams } from "tesseract.js";
import * as v from "valibot";
import {
  DISPLAY_STAT_NAME_RECORD,
  IMAGE_LABELS,
  OCR_LABELS,
  type OcrCroppedImageRecord,
  type OcrExtractedPromiseTextRecord,
  type OcrExtractedTextRecord,
  WHITE_LIST,
} from "../types/index.js";
import type { OcrQueueManager } from "./manager.js";

const defaultParams: Partial<WorkerParams> = {
  tessedit_pageseg_mode: PSM.SINGLE_LINE,
  tessedit_char_whitelist: "", // ホワイトリストなし
} as const;

const levelParams: Partial<WorkerParams> = {
  ...defaultParams,
  tessedit_char_whitelist: WHITE_LIST.level + WHITE_LIST.number,
} as const;

const displayStatNameList = Object.values(DISPLAY_STAT_NAME_RECORD).flat();
const statNameWWhiteListString = displayStatNameList.join("");
const statNameParams: Partial<WorkerParams> = {
  ...defaultParams,
  tessedit_char_whitelist: statNameWWhiteListString,
} as const;

const statValueParams: Partial<WorkerParams> = {
  ...defaultParams,
  tessedit_char_whitelist: WHITE_LIST.statValue + WHITE_LIST.number,
} as const;

export function extractOcrPromiseTexts(
  manager: OcrQueueManager,
  ocrImages: OcrCroppedImageRecord,
): OcrExtractedPromiseTextRecord {
  return R.mapValues(ocrImages, (ocrValue, ocrKey) => {
    const params =
      ocrKey === "name"
        ? defaultParams
        : ocrKey === "level"
          ? levelParams
          : ocrKey.includes("stat_name")
            ? statNameParams
            : statValueParams;
    return R.mapValues(ocrValue, (value) => manager.process(value, params));
  });
}

export function extractOcrTexts(
  textsAsync: OcrExtractedPromiseTextRecord,
): Promise<OcrExtractedTextRecord> {
  return R.pipe(
    textsAsync,
    R.entries(),
    R.map(([ocrKey, ocrValue]) =>
      Promise.all(
        R.pipe(
          ocrValue,
          R.entries(),
          R.map(([key, promiseValue]) =>
            promiseValue.then((value) => [key, value]),
          ),
        ),
      ).then((promiesEntries) => [ocrKey, Object.fromEntries(promiesEntries)]),
    ),
    (promiesEntries) =>
      Promise.all(promiesEntries).then((entries) =>
        v.parse(
          v.object(
            v.entriesFromList(
              OCR_LABELS,
              v.object(v.entriesFromList(IMAGE_LABELS, v.string())),
            ),
          ),
          Object.fromEntries(entries),
        ),
      ),
  );
}
