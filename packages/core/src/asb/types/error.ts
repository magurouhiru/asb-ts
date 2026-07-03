import type * as v from "valibot";

export type ASBTSErrorObject =
  | ASBTSErrorValibotObject
  | ASBTSErrorCommonObject
  | ASBTSErrorUnknownObject;

export interface ASBTSErrorValibotObject {
  readonly _tag: "ASBTSError";
  readonly type: "valibot";
  readonly flatError: v.FlatErrors<v.GenericSchema>;
  readonly valiError: v.ValiError<v.GenericSchema | v.GenericSchemaAsync>;
}

export interface ASBTSErrorCommonObject {
  readonly _tag: "ASBTSError";
  readonly type: "common";
  readonly message: string;
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
  readonly _tag = "ASBTSError";
  readonly type = "common";

  readonly message;
  readonly functionName;
  readonly input;
  readonly context;

  constructor(
    message: string,
    functionName: string,
    input: object,
    context?: object | undefined,
  ) {
    super(message);
    this.name = "ASBTSErrorCommon";
    this.message = message;
    this.functionName = functionName;
    this.input = input;
    this.context = context;
  }

  toObject(): ASBTSErrorCommonObject {
    return {
      _tag: this._tag,
      type: this.type,
      message: this.message,
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

export function isASBTSErrorValibot(
  // biome-ignore lint/suspicious/noExplicitAny: 型判定のためなんでも受け取れるようにanyにする
  error: any,
): error is ASBTSErrorValibotObject {
  return (
    error &&
    typeof error === "object" &&
    error._tag === "ASBTSError" &&
    error.type === "valibot"
  );
}

export function isASBTSErrorCommon(
  // biome-ignore lint/suspicious/noExplicitAny: 型判定のためなんでも受け取れるようにanyにする
  error: any,
): error is ASBTSErrorCommon | ASBTSErrorCommonObject {
  return (
    error &&
    typeof error === "object" &&
    error._tag === "ASBTSError" &&
    error.type === "common"
  );
}

export function isASBTSErrorUnknown(
  // biome-ignore lint/suspicious/noExplicitAny: 型判定のためなんでも受け取れるようにanyにする
  error: any,
): error is ASBTSErrorUnknownObject {
  return (
    error &&
    typeof error === "object" &&
    error._tag === "ASBTSError" &&
    error.type === "unknown"
  );
}
