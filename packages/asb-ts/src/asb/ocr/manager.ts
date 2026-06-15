import {
  createWorker,
  type ImageLike,
  type Lang,
  OEM,
  type Worker,
  type WorkerOptions,
  type WorkerParams,
} from "tesseract.js";
import type { OcrQueueManagerStatus } from "../types/index.js";

export class OcrQueueManager {
  private queue: Promise<string>[] = [
    Promise.resolve(""),
    Promise.resolve(""),
    Promise.resolve(""),
    Promise.resolve(""),
  ];

  private initPromise: Promise<Worker>[] | null = null;

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
  private maxNumberOfWorker = this.queue.length;
  private numberOfWorker = 2;

  constructor(
    langs: string | string[] | Lang[] = ["jpn"],
    oem: OEM = OEM.LSTM_ONLY,
    options: Partial<WorkerOptions> = {},
    numberOfWorker = 2,
    callBack?: (
      status: OcrQueueManagerStatus,
      requestCnt: number,
      completeCnt: number,
    ) => void,
  ) {
    this.langs = langs;
    this.oem = oem;
    this.options = options;
    this.numberOfWorker = Math.min(numberOfWorker, this.maxNumberOfWorker);
    if (callBack) this.callBack = callBack;
  }

  private ensureInitialized(): Promise<Worker>[] {
    if (this.initPromise) {
      return this.initPromise;
    }

    const array = Array.from({ length: this.numberOfWorker }, (_, i) => i);
    this.initPromise = array.map(() =>
      createWorker(this.langs, this.oem, this.options).then((worker) => {
        if (this.callBack)
          this.callBack(this.status, this.requestCnt, this.completeCnt);
        return worker;
      }),
    );

    return this.initPromise;
  }

  async process(
    img: ImageLike,
    params: Partial<WorkerParams>,
  ): Promise<string> {
    this.requestCnt = this.requestCnt + 1;
    const index = this.requestCnt % this.numberOfWorker;

    // 列の最後尾に自分を並ばせる
    // 毎回paramsを変えたいので、数珠つなぎにして、順番が変にならないようにする
    this.queue[index] = (this.queue[index] as Promise<string>)
      .then(() => {
        this.status = "Running";
        if (this.callBack)
          this.callBack(this.status, this.requestCnt, this.completeCnt);
      })
      .then(() => this.ensureInitialized()[index] as Promise<Worker>)
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

    return this.queue[index];
  }

  private async executeOcr(
    worker: Worker,
    img: ImageLike,
    params: Partial<WorkerParams>,
  ): Promise<string> {
    await worker.setParameters(params);
    const response = await worker.recognize(img);
    return response.data.text.trim();
  }

  async terminate() {
    if (this.initPromise) {
      const workers = this.initPromise;
      for (const worker of workers) {
        const w = await worker;
        w.terminate;
      }
      this.initPromise = null;
    }
  }
}
