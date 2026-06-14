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
  IMG_PACK_LABELS,
  type ImgPacks_Browser,
  type LogDetail,
  type NormalizedTexts,
  type NormalizeInput,
  NormalizeInputSchema,
  type NormalizeLog,
  NormalizeOutputSchema,
  NormalizeProcessSchema,
  OCR_LABELS,
  OCR_STAT_NAME_LABELS,
  OCR_STAT_VALUE_LABELS,
  type OcrCommonLabel,
  type OcrLabel,
  type OcrText,
  type OcrTexts,
  type PreInput,
  PreInputSchema,
  PreOutputSchema,
  PreProcessSchema,
  type Region,
  type Regions,
  type SelectInput,
  SelectInputSchema,
  SelectOutputSchema,
  SelectProcessSchema,
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

const statNameParams: Partial<WorkerParams> = {
  ...defaultParams,
  tessedit_char_whitelist:
    "体力スタミナ酸素量食料重量近接攻撃力気絶値刷り込み中",
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
  const logs: NormalizeLog = { name: [], totalLevel: [] };
  const name = getNormalizedTextName(ocrTexts, logs.name);
  const totalLevel = getNormalizedTextTotalLevel(ocrTexts, logs.totalLevel);
  return {
    normalizedTexts: {
      name,
      totalLevel,
    },
    logs,
  };
}

function getNormalizedTextName(
  ocrTexts: OcrTexts,
  _log: LogDetail[],
): string | null {
  const ocrText = ocrTexts.name;
  const result = v.safeParse(
    v.pipe(
      PreInputSchema,
      PreProcessSchema(preRemoveSpace),
      PreOutputSchema,
      SelectInputSchema,
      SelectProcessSchema(selectIfSameString),
      SelectProcessSchema(selectFallback),
      SelectOutputSchema,
      NormalizeInputSchema,
      NormalizeOutputSchema,
    ),
    { ocrText },
  );
  if (result.success) {
    return result.output;
  } else {
    return null;
  }
}

function getNormalizedTextTotalLevel(
  ocrTexts: OcrTexts,
  _log: LogDetail[],
): NormalizedTexts["totalLevel"] {
  const ocrText = ocrTexts.level;
  const result = v.safeParse(
    v.pipe(
      PreInputSchema,
      PreProcessSchema(preRemoveSpace),
      PreOutputSchema,
      SelectInputSchema,
      SelectProcessSchema(selectIfSameString),
      SelectProcessSchema(selectTextIfMatchTotalLevelRegExp),
      SelectProcessSchema(selectFallback),
      SelectOutputSchema,
      NormalizeInputSchema,
      NormalizeProcessSchema(normalizeRemoveLevel),
      NormalizeOutputSchema,
      v.toNumber(),
      TotalLevelSchema,
    ),
    { ocrText },
  );
  if (result.success) {
    return result.output;
  } else {
    return null;
  }
}

const preRemoveSpace = ({
  ocrText: { original, grayscale, binary },
}: PreInput): PreInput => ({
  ocrText: {
    original: removeStringCore(original, spaceString),
    grayscale: removeStringCore(grayscale, spaceString),
    binary: removeStringCore(binary, spaceString),
  },
});

const selectIfSameString = (input: SelectInput): SelectInput => {
  const { original, grayscale, binary } = input.ocrText;
  let selectedText = null;
  if (original === grayscale && original === binary) {
    selectedText = original;
  } else if (original === grayscale) {
    selectedText = original;
  } else if (grayscale === binary) {
    selectedText = grayscale;
  } else if (binary === original) {
    selectedText = binary;
  } else {
    selectedText = null;
  }

  return { ...input, selectedText };
};

const totalLevelRegExp = /レベル:\d{1,3}/;

const selectTextIfMatchTotalLevelRegExp = (
  input: SelectInput,
): SelectInput => ({
  ...input,
  selectedText: selectTextIfMatchCore(input, totalLevelRegExp),
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

const selectFallback = (input: SelectInput): SelectInput => ({
  ...input,
  selectedText: input.ocrText.original,
});

const normalizeRemoveLevel = (input: NormalizeInput): NormalizeInput => ({
  ...input,
  normalizedText: removeStringCore(input.normalizedText, levelWhiteListString),
});

const spaceString = " 　";
function removeStringCore(input: string, param: string): string {
  return Array.from(param).reduce((acc, v) => acc.replaceAll(v, ""), input);
}
