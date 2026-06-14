import {
  createWorker,
  type ImageLike,
  type Lang,
  OEM,
  PSM,
  type Worker,
  type WorkerOptions,
  type WorkerParams,
} from "tesseract.js";
import * as v from "valibot";
import {
  DISPLAY_STAT_NAME_DICT,
  IMG_PACK_LABELS,
  type ImgPacks_Browser,
  type LogDetail,
  type NormalizedTexts,
  type NormalizeInput,
  type NormalizeLog,
  type NormalizeProcessLogic,
  NormalizeProcessSchema,
  OCR_LABELS,
  OCR_STAT_NAME_LABELS,
  OCR_STAT_VALUE_LABELS,
  type OcrCommonLabel,
  type OcrLabel,
  type OcrStatNameLabel,
  type OcrText,
  type OcrTexts,
  type PreInput,
  type PreProcessLogic,
  PreProcessSchema,
  type Region,
  type Regions,
  type SelectInput,
  type SelectProcessLogic,
  SelectProcessSchema,
  ToNormalizeInputSchema,
  ToSelectInputSchema,
  ToStringSchema,
  TotalLevelSchema,
} from "./types/index.js";

const Status = ["Not initialized", "Suspended", "Running"] as const;
export type OcrQueueManagerStatus = (typeof Status)[number];

export class OcrQueueManager {
  private queue: Promise<string> = Promise.resolve("");

  // 💡 初期化処理そのものを Promise として保持し、重複実行を防ぐ
  private initPromise: Promise<Worker> | null = null;

  private status: OcrQueueManagerStatus = "Not initialized";
  private requestCnt = 0;
  private completeCnt = 0;

  private callBack?: (
    status: OcrQueueManagerStatus,
    requestCnt: number,
    completeCnt: number,
  ) => void;

  private langs: string | string[] | Lang[] = ["jpn"];
  private oem: OEM = OEM.LSTM_ONLY;
  private options: Partial<WorkerOptions> = {};

  constructor(
    langs: string | string[] | Lang[] = ["jpn"],
    oem: OEM = OEM.LSTM_ONLY,
    options: Partial<WorkerOptions> = {},
    callBack?: (
      status: OcrQueueManagerStatus,
      requestCnt: number,
      completeCnt: number,
    ) => void,
  ) {
    this.langs = langs;
    this.oem = oem;
    this.options = options;
    if (callBack) this.callBack = callBack;
  }

  /**
   * 💡 内部専用の初期化関数（外部から呼ぶ必要はありません）
   */
  private ensureInitialized(): Promise<Worker> {
    // すでに初期化中、または初期化済みの場合はその Promise をそのまま返す
    if (this.initPromise) {
      return this.initPromise;
    }

    // 最初の1回目だけ、新しく初期化の Promise を作成して保持する
    this.initPromise = createWorker(this.langs, this.oem, this.options).then(
      (worker) => {
        if (this.callBack)
          this.callBack(this.status, this.requestCnt, this.completeCnt);
        return worker;
      },
    );

    return this.initPromise;
  }

  /**
   * 💡 呼び出し側は、いつでも・初期化を気にせず、ただ呼ぶだけでOK！
   */
  async process(
    img: ImageLike,
    params: Partial<WorkerParams>,
  ): Promise<string> {
    this.requestCnt = this.requestCnt + 1;
    // 列の最後尾に自分を並ばせる
    // 毎回paramsを変えたいので、数珠つなぎにして、順番が変にならないようにする
    this.queue = this.queue
      .then(() => {
        this.status = "Running";
        if (this.callBack)
          this.callBack(this.status, this.requestCnt, this.completeCnt);
      })
      .then(() => this.ensureInitialized())
      .then((worker) => this.executeOcr(worker, img, params))
      .then((text) => {
        this.status = "Suspended";
        this.completeCnt = this.completeCnt + 1;
        if (this.callBack)
          this.callBack(this.status, this.requestCnt, this.completeCnt);
        return text;
      })
      .catch((error) => {
        throw error;
      });

    return this.queue;
  }

  // 実際にOCRを処理する内部関数
  private async executeOcr(
    worker: Worker,
    img: ImageLike,
    params: Partial<WorkerParams>,
  ): Promise<string> {
    await worker.setParameters(params);
    const response = await worker.recognize(img);
    return response.data.text.trim();
  }

  // アプリ終了時などに明示的に破棄したい場合のみ使用
  async terminate() {
    if (this.initPromise) {
      const worker = await this.initPromise;
      await worker.terminate();
      this.initPromise = null;
    }
  }
}

export function getRegions(
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
): Regions {
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

export function getNameLevelRegion(
  originalWidth: number,
  originalHeight: number,
  ym: number,
  dlm: number,
  drm: number,
  dhm: number,
): Pick<Regions, OcrCommonLabel> {
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

export function getStatsRegions(
  originalWidth: number,
  originalHeight: number,
  ym: number,
  dlm: number,
  drm: number,
  dhm: number,
): Omit<Regions, OcrCommonLabel> {
  const y = originalHeight * ym;
  const dl = originalHeight * dlm;
  const dr = originalHeight * drm;
  const dh = originalHeight * dhm;
  return Object.fromEntries([
    ...OCR_STAT_NAME_LABELS.map((label, i) => [
      label,
      getStatNameRegion(originalWidth, y, dl, dh, i),
    ]),
    ...OCR_STAT_VALUE_LABELS.map((label, i) => [
      label,
      getStatValueRegion(originalWidth, y, dr, dh, i),
    ]),
  ]);
}

export function getStatNameRegion(
  originalWidth: number,
  y: number,
  dl: number,
  dh: number,
  i: number,
): Region {
  return {
    x: originalWidth / 2 - dl,
    y: y + dh * i,
    width: dl,
    height: dh,
  };
}

export function getStatValueRegion(
  originalWidth: number,
  y: number,
  dr: number,
  dh: number,
  i: number,
): Region {
  return {
    x: originalWidth / 2,
    y: y + dh * i,
    width: dr,
    height: dh,
  };
}

const defaultParams: Partial<WorkerParams> = {
  tessedit_pageseg_mode: PSM.SINGLE_LINE,
  tessedit_char_whitelist: "",
} as const;

const levelWhiteListString = "レベル:" as const;
const whiteListNumber = "0123456789" as const;
const levelParams: Partial<WorkerParams> = {
  ...defaultParams,
  tessedit_char_whitelist: levelWhiteListString + whiteListNumber,
} as const;

const displayStatNameList = Object.values(DISPLAY_STAT_NAME_DICT).flat();
const statNameWWhiteListString = displayStatNameList.join("");
const statNameParams: Partial<WorkerParams> = {
  ...defaultParams,
  tessedit_char_whitelist: statNameWWhiteListString,
} as const;

const statValueWhiteListString = "./%" as const;
const statValueParams: Partial<WorkerParams> = {
  ...defaultParams,
  tessedit_char_whitelist: statValueWhiteListString + whiteListNumber,
} as const;

export async function getOcrTexts(
  manager: OcrQueueManager,
  imgPacks: ImgPacks_Browser,
): Promise<OcrTexts> {
  return Promise.all(
    OCR_LABELS.map((label) => getOcrText(manager, imgPacks, label)),
  ).then((v) => Object.fromEntries(v) as OcrTexts);
}

export async function getOcrText(
  manager: OcrQueueManager,
  imgPacks: ImgPacks_Browser,
  label: OcrLabel,
): Promise<[OcrLabel, OcrText]> {
  let params: Partial<WorkerParams> | null = null;
  switch (label) {
    case "name":
      params = defaultParams;
      break;
    case "level":
      params = levelParams;
      break;
    default:
      if (label.includes("stat_name_")) {
        params = statNameParams;
        break;
      } else {
        params = statValueParams;
        break;
      }
  }
  return Promise.all([
    manager.process(imgPacks[label].original, params),
    manager.process(imgPacks[label].grayscale, params),
    manager.process(imgPacks[label].binary, params),
  ]).then(([original, grayscale, binary]) => [
    label,
    {
      original,
      grayscale,
      binary,
    },
  ]);
}

export function getNormalizedTexts(ocrTexts: OcrTexts): {
  normalizedTexts: NormalizedTexts;
  logs: NormalizeLog;
} {
  const name = getNormalizedTextName(ocrTexts.name, []);
  const totalLevel = getNormalizedTextTotalLevel(ocrTexts.level, []);

  const stat_name_obj = Object.fromEntries(
    OCR_STAT_NAME_LABELS.map((label) => [
      label,
      getNormalizedTextStatName(ocrTexts[label], []),
    ]),
  ) as Record<OcrStatNameLabel, { log: LogDetail[]; result: string | null }>;

  return {
    normalizedTexts: {
      name: name.result,
      totalLevel: totalLevel.result,

      stat_name_0: stat_name_obj.stat_name_0.result,
      stat_name_1: stat_name_obj.stat_name_1.result,
      stat_name_2: stat_name_obj.stat_name_2.result,
      stat_name_3: stat_name_obj.stat_name_3.result,
      stat_name_4: stat_name_obj.stat_name_4.result,

      stat_name_5: stat_name_obj.stat_name_5.result,
      stat_name_6: stat_name_obj.stat_name_6.result,
      stat_name_7: stat_name_obj.stat_name_7.result,
      stat_name_8: stat_name_obj.stat_name_8.result,
      stat_name_9: stat_name_obj.stat_name_9.result,
    },
    logs: {
      name: name.log,
      totalLevel: totalLevel.log,

      stat_name_0: stat_name_obj.stat_name_0.log,
      stat_name_1: stat_name_obj.stat_name_1.log,
      stat_name_2: stat_name_obj.stat_name_2.log,
      stat_name_3: stat_name_obj.stat_name_3.log,
      stat_name_4: stat_name_obj.stat_name_4.log,

      stat_name_5: stat_name_obj.stat_name_5.log,
      stat_name_6: stat_name_obj.stat_name_6.log,
      stat_name_7: stat_name_obj.stat_name_7.log,
      stat_name_8: stat_name_obj.stat_name_8.log,
      stat_name_9: stat_name_obj.stat_name_9.log,
    },
  };
}

function getNormalizedTextName(
  ocrText: OcrText,
  log: LogDetail[],
): { log: LogDetail[]; result: NormalizedTexts["name"] } {
  const result = v.safeParse(
    v.pipe(
      PreProcessSchema(preRemoveSpace, log),
      ToSelectInputSchema,
      SelectProcessSchema(selectIfSameString, log),
      SelectProcessSchema(selectFallback, log),
      ToNormalizeInputSchema,
      ToStringSchema,
    ),
    { ocrText },
  );
  if (result.success) {
    return { log, result: result.output };
  } else {
    const flatError = v.flatten(result.issues);
    log.push({
      isValibotError: true,
      action: "valibot safeParse",
      flatError,
    });
    return { log, result: null };
  }
}

function getNormalizedTextTotalLevel(
  ocrText: OcrText,
  log: LogDetail[],
): { log: LogDetail[]; result: NormalizedTexts["totalLevel"] } {
  const result = v.safeParse(
    v.pipe(
      PreProcessSchema(preRemoveSpace, log),
      ToSelectInputSchema,
      SelectProcessSchema(selectTextIfMatchTotalLevelRegExp, log),
      ToNormalizeInputSchema,
      NormalizeProcessSchema(normalizeRemoveLevel, log),
      ToStringSchema,
      v.nonEmpty(),
      v.toNumber(),
      TotalLevelSchema,
    ),
    { log, ocrText },
  );
  if (result.success) {
    return { log, result: result.output };
  } else {
    const flatError = v.flatten(result.issues);
    log.push({
      isValibotError: true,
      action: "valibot safeParse",
      flatError,
    });
    return { log, result: null };
  }
}

function getNormalizedTextStatName(
  ocrText: OcrText,
  log: LogDetail[],
): { log: LogDetail[]; result: string | null } {
  const result = v.safeParse(
    v.pipe(
      PreProcessSchema(preRemoveSpace, log),
      ToSelectInputSchema,
      SelectProcessSchema(selectTextIfExactMatchStatName, log),
      ToNormalizeInputSchema,
      ToStringSchema,
    ),
    { ocrText },
  );
  if (result.success) {
    return { log, result: result.output };
  } else {
    const flatError = v.flatten(result.issues);
    log.push({
      isValibotError: true,
      action: "valibot safeParse",
      flatError,
    });
    return { log, result: null };
  }
}

const preRemoveSpace: PreProcessLogic = ({
  ocrText: { original, grayscale, binary },
}: PreInput) => ({
  action: "preRemoveSpace",
  output: {
    original: removeStringCore(original, spaceString),
    grayscale: removeStringCore(grayscale, spaceString),
    binary: removeStringCore(binary, spaceString),
  },
  param: spaceString,
});

const selectIfSameString: SelectProcessLogic = (input: SelectInput) => {
  const { original, grayscale, binary } = input.ocrText;
  let output = null;
  if (original === grayscale && original === binary) {
    output = original;
  } else if (original === grayscale) {
    output = original;
  } else if (grayscale === binary) {
    output = grayscale;
  } else if (binary === original) {
    output = binary;
  } else {
    output = null;
  }

  return { action: "selectIfSameString", output: output };
};

const totalLevelRegExp = /レベル:\d{1,3}/;

const selectTextIfMatchTotalLevelRegExp: SelectProcessLogic = (
  input: SelectInput,
) => ({
  action: "selectTextIfMatchTotalLevelRegExp",
  output: selectTextIfMatchCore(input, totalLevelRegExp),
  param: totalLevelRegExp.source,
});

function selectTextIfMatchCore(
  { ocrText }: SelectInput,
  target: RegExp,
): string | null {
  const matchList = IMG_PACK_LABELS.filter((label) =>
    target.test(ocrText[label]),
  );
  if (matchList.length > 0) {
    if (matchList.includes("original")) {
      return ocrText.original;
    } else if (matchList.includes("grayscale")) {
      return ocrText.grayscale;
    } else {
      return ocrText.binary;
    }
  } else {
    return null;
  }
}

const selectTextIfExactMatchStatName: SelectProcessLogic = (
  input: SelectInput,
) => {
  const found = IMG_PACK_LABELS.map((label) =>
    displayStatNameList.find((name) => input.ocrText[label] === name),
  ).filter((v) => v !== undefined)[0];
  return {
    action: "selectTextIfExactMatchStatName",
    output: found !== undefined ? found : null,
    param: JSON.stringify(displayStatNameList),
  };
};

const selectFallback: SelectProcessLogic = (input: SelectInput) => ({
  action: "selectFallback",
  output: input.ocrText.original,
});

const normalizeRemoveLevel: NormalizeProcessLogic = (
  input: NormalizeInput,
) => ({
  action: "normalizeRemoveLevel",
  output: removeStringCore(input.normalizedText, levelWhiteListString),
  param: levelWhiteListString,
});

const spaceString = " 　";
function removeStringCore(input: string, param: string): string {
  return Array.from(param).reduce((acc, v) => acc.replaceAll(v, ""), input);
}
