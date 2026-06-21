import type * as v from "valibot";

export type ASBTSErrorObject =
  | ASBTSErrorValibotObject
  | ASBTSErrorCommonObject
  | ASBTSErrorUnknownObject;

export interface ASBTSErrorValibotObject {
  readonly _tag: "ASBTSError";
  readonly type: "valibot";
  readonly flatError: v.FlatErrors<v.GenericSchema>;
}

export interface ASBTSErrorCommonObject {
  readonly _tag: "ASBTSError";
  readonly type: "common";
  readonly functionName: string;
  readonly input: object;
  readonly context?: object | undefined;
}

export interface ASBTSErrorUnknownObject {
  readonly _tag: "ASBTSError";
  readonly type: "unknown";
  // biome-ignore lint/suspicious/noExplicitAny: ちゃんとできていたら使わないけど、念のためanyにして受け取れるようにする。
  readonly error: any;
}

export class ASBTSErrorCommon extends Error implements ASBTSErrorCommonObject {
  public readonly _tag = "ASBTSError";
  public readonly type = "common";

  constructor(
    message: string,
    public readonly functionName: string,
    public readonly input: object,
    public readonly context?: object | undefined,
  ) {
    super(message);
  }

  toObject(): ASBTSErrorCommonObject {
    return {
      _tag: this._tag,
      type: this.type,
      functionName: this.functionName,
      input: this.input,
      ...(this.context !== undefined ? { context: this.context } : {}),
    };
  }

  // JSON.stringify() されたときに自動でプレーンオブジェクトに化ける魔術らしい
  toJSON(): ASBTSErrorCommonObject {
    return this.toObject();
  }
}

export function isASBTSErrorCommonObject(
  // biome-ignore lint/suspicious/noExplicitAny: 型判定のためなんでも受け取れるようにanyにする
  error: any,
): error is ASBTSErrorCommonObject {
  return (
    error &&
    typeof error === "object" &&
    error._tag === "ASBTSError" &&
    error.type === "common"
  );
}

export function isASBTSErrorCommon(
  // biome-ignore lint/suspicious/noExplicitAny: 型判定のためなんでも受け取れるようにanyにする
  error: any,
): typeof isASBTSErrorCommon {
  return (
    error &&
    typeof error === "object" &&
    error._tag === "ASBTSError" &&
    error.type === "common"
  );
}
