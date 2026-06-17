import * as R from "remeda";
import { PSM, type WorkerParams } from "tesseract.js";
import * as v from "valibot";
import {
  DISPLAY_STAT_NAME_RECORD,
  EXTRACT_TYPES,
  IMAGE_LABELS,
  OCR_LABELS,
  type OcrCroppedImageRecord,
  type OcrExtractedPromiseTextRecord,
  type OcrExtractedTextRecord,
  type OcrStatNameLabel,
  type OcrStatValueLabel,
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
  return R.mapValues(ocrImages, (images, ol) =>
    ol === "name"
      ? extractOcrPromiseTextName(manager, images)
      : ol === "level"
        ? extractOcrPromiseTextLevel(manager, images)
        : ol === "stat_name_0"
          ? extractOcrPromiseTextStatName0(manager, images)
          : ol.includes("stat_name_")
            ? extractOcrPromiseTextStatName(manager, images)
            : extractOcrPromiseTextStatValue(manager, images),
  );
}

function extractOcrPromiseTextName(
  manager: OcrQueueManager,
  images: OcrCroppedImageRecord["name"],
): OcrExtractedPromiseTextRecord["name"] {
  return R.fromKeys(
    EXTRACT_TYPES.filter((type) => type === "default"),
    () => R.mapValues(images, (img) => manager.process(img, defaultParams)),
  );
}

function extractOcrPromiseTextLevel(
  manager: OcrQueueManager,
  images: OcrCroppedImageRecord["level"],
): OcrExtractedPromiseTextRecord["level"] {
  return R.fromKeys(
    EXTRACT_TYPES.filter((type) => type === "level"),
    () => R.mapValues(images, (img) => manager.process(img, levelParams)),
  );
}

function extractOcrPromiseTextStatName0(
  manager: OcrQueueManager,
  images: OcrCroppedImageRecord["stat_name_0"],
): OcrExtractedPromiseTextRecord["stat_name_0"] {
  return R.fromKeys(
    EXTRACT_TYPES.filter((type) => type === "statName" || type === "statValue"),
    (type) =>
      type === "statName"
        ? R.mapValues(images, (img) => manager.process(img, statNameParams))
        : R.mapValues(images, (img) => manager.process(img, statValueParams)),
  );
}

function extractOcrPromiseTextStatName(
  manager: OcrQueueManager,
  images: OcrCroppedImageRecord[Exclude<OcrStatNameLabel, "stat_name_0">],
): OcrExtractedPromiseTextRecord[Exclude<OcrStatNameLabel, "stat_name_0">] {
  return R.fromKeys(
    EXTRACT_TYPES.filter((type) => type === "statName"),
    () => R.mapValues(images, (img) => manager.process(img, statNameParams)),
  );
}

function extractOcrPromiseTextStatValue(
  manager: OcrQueueManager,
  images: OcrCroppedImageRecord[OcrStatValueLabel],
): OcrExtractedPromiseTextRecord[OcrStatValueLabel] {
  return R.fromKeys(
    EXTRACT_TYPES.filter((type) => type === "statValue"),
    () => R.mapValues(images, (img) => manager.process(img, statValueParams)),
  );
}

export function extractOcrTexts(
  textsAsync: OcrExtractedPromiseTextRecord,
): Promise<OcrExtractedTextRecord> {
  return R.pipe(
    textsAsync,
    R.entries(),
    R.map(([ol, ov]) =>
      Promise.all(
        R.pipe(
          ov,
          R.entries(),
          R.map(([et, ev]) =>
            Promise.all(
              R.pipe(
                ev,
                R.entries(),
                R.map(([il, pt]) => pt.then((t) => [il, t])),
              ),
            ).then((promiesEntries) => [
              et,
              Object.fromEntries(promiesEntries),
            ]),
          ),
        ),
      ).then((promiesEntries) => [ol, Object.fromEntries(promiesEntries)]),
    ),
    (promiesEntries) =>
      Promise.all(promiesEntries).then((entries) =>
        v.parse(
          v.object(
            v.entriesFromList(
              OCR_LABELS,
              v.record(
                v.picklist(EXTRACT_TYPES),
                v.object(v.entriesFromList(IMAGE_LABELS, v.string())),
              ),
            ),
          ),
          Object.fromEntries(entries),
        ),
      ),
  );
}
