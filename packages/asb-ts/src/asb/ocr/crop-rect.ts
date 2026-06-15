import * as R from "remeda";
import {
  type CropRect,
  OCR_STAT_NAME_LABELS,
  OCR_STAT_VALUE_LABELS,
  type OcrCommonLabel,
  type OcrCropRectRecord,
} from "../types/index.js";

export function calcCropRects(
  originalWidth: number,
  originalHeight: number,
  ymNL: number,
  dlmNL: number,
  drmNL: number,
  dhmNL: number,
  ymS: number,
  dlmS: number,
  drmS: number,
  dhmS: number,
): OcrCropRectRecord {
  return {
    ...getNameLevelRegion(
      originalWidth,
      originalHeight,
      ymNL,
      dlmNL,
      drmNL,
      dhmNL,
    ),
    ...getStatsRegions(originalWidth, originalHeight, ymS, dlmS, drmS, dhmS),
  };
}

function getNameLevelRegion(
  originalWidth: number,
  originalHeight: number,
  ym: number,
  dlm: number,
  drm: number,
  dhm: number,
): Pick<OcrCropRectRecord, OcrCommonLabel> {
  const y = originalHeight * ym;
  const dl = originalHeight * dlm;
  const dr = originalHeight * drm;
  const dh = originalHeight * dhm;

  return {
    name: {
      x: originalWidth / 2 - dl,
      y: y,
      width: dl + dr,
      height: dh,
    },
    level: {
      x: originalWidth / 2 - dl,
      y: y + dh,
      width: dl + dr,
      height: dh,
    },
  };
}

function getStatsRegions(
  originalWidth: number,
  originalHeight: number,
  ym: number,
  dlm: number,
  drm: number,
  dhm: number,
): Omit<OcrCropRectRecord, OcrCommonLabel> {
  const y = originalHeight * ym;
  const dl = originalHeight * dlm;
  const dr = originalHeight * drm;
  const dh = originalHeight * dhm;

  const statName = R.fromKeys(OCR_STAT_NAME_LABELS, (_, i) =>
    getStatNameRegion(originalWidth, y, dl, dh, i),
  );

  const statValue = R.fromKeys(OCR_STAT_VALUE_LABELS, (_, i) =>
    getStatValueRegion(originalWidth, y, dr, dh, i),
  );

  return {
    ...statName,
    ...statValue,
  };
}

function getStatNameRegion(
  originalWidth: number,
  y: number,
  dl: number,
  dh: number,
  i: number,
): CropRect {
  return {
    x: originalWidth / 2 - dl,
    y: y + dh * i,
    width: dl,
    height: dh,
  };
}

function getStatValueRegion(
  originalWidth: number,
  y: number,
  dr: number,
  dh: number,
  i: number,
): CropRect {
  return {
    x: originalWidth / 2,
    y: y + dh * i,
    width: dr,
    height: dh,
  };
}
