import * as v from "valibot";

export type ASBTSErrorObject =
  | ASBTSErrorValibotObject
  | ASBTSErrorCommonObject
  | ASBTSErrorUnknownObject;

export interface ASBTSErrorValibotObject {
  _tag: "ASBTSError";
  type: "valibot";
  flatError: v.FlatErrors<v.GenericSchema>;
}

export interface ASBTSErrorCommonObject {
  _tag: "ASBTSError";
  type: "common";
  functionName: string;
  input: object;
  context?: object;
}

export interface ASBTSErrorUnknownObject {
  _tag: "ASBTSError";
  type: "unknown";
  // biome-ignore lint/suspicious/noExplicitAny: ちゃんとできていたら使わないけど、念のためanyにして受け取れるようにする。
  error: any;
}

export class ASBTSErrorCommon extends Error {
  readonly #functionName: string;
  readonly #input: object;
  readonly #context?: object;

  constructor(
    message: string,
    functionName: string,
    input: object,
    context?: object,
  ) {
    super(message);
    this.#functionName = functionName;
    this.#input = input;
    if (context !== undefined) this.#context = context;
  }

  toObject(): ASBTSErrorCommonObject {
    return {
      _tag: "ASBTSError",
      type: "common",
      functionName: this.#functionName,
      input: this.#input,
      ...(this.#context !== undefined ? { context: this.#context } : {}),
    };
  }

  // JSON.stringify() されたときに自動でプレーンオブジェクトに化ける魔術らしい
  toJSON(): ASBTSErrorCommonObject {
    return this.toObject();
  }
}

export function isASBTSErrorCommon(error: any) {}
