import * as R from "remeda";
import * as v from "valibot";
import {
  DISPLAY_STAT_NAME_RECORD,
  type DisplayStatNameLabel,
  type ExtractedTextRecord,
  IMAGE_LABELS,
  type ImageLabel,
  type LogDetail,
  WHITE_LIST,
} from "../types/index.js";

export const ExtractedTextSchema = v.object(
  v.entriesFromList(IMAGE_LABELS, v.string()),
);

export const PreInputSchema = v.object({
  texts: ExtractedTextSchema,
});
export type PreInput = v.InferOutput<typeof PreInputSchema>;

export const SelectInputSchema = v.object({
  texts: ExtractedTextSchema,
  selectedText: v.nullable(v.string()),
});
export type SelectInput = v.InferOutput<typeof SelectInputSchema>;

export const NormalizeInputSchema = v.object({
  texts: ExtractedTextSchema,
  selectedText: v.string(),
  normalizedText: v.string(),
});
export type NormalizeInput = v.InferOutput<typeof NormalizeInputSchema>;

export type PreProcessLogic = (input: PreInput) => {
  action: string;
  output: ExtractedTextRecord<string>;
  param?: string;
};

export const PreProcessSchema = (logic: PreProcessLogic, log: LogDetail[]) =>
  v.pipe(
    PreInputSchema,
    v.transform((input: PreInput) => {
      const result = logic(input);
      log.push({
        ...result,
        isValibotError: false,
        input: JSON.stringify(input.texts, null, 2),
        output: JSON.stringify(result.output, null, 2),
      });
      return { ...input, texts: result.output };
    }),
  );

export type SelectProcessLogic = (input: SelectInput) => {
  action: string;
  output: ImageLabel | null;
  param?: string;
};

export const SelectProcessSchema = (
  logic: SelectProcessLogic,
  log: LogDetail[],
) =>
  v.pipe(
    SelectInputSchema,
    v.transform((input: SelectInput) => {
      const result = logic(input);
      if (input.selectedText === null) {
        log.push({
          ...result,
          isValibotError: false,
          input: JSON.stringify(input.texts, null, 2),
          output: result.output,
        });
        if (result.output !== null) {
          return { ...input, selectedText: input.texts[result.output] };
        } else {
          return input;
        }
      } else {
        log.push({
          ...result,
          isValibotError: false,
          input: JSON.stringify(input.texts, null, 2),
          output: "Already selected",
        });
        return input;
      }
    }),
  );

export type NormalizeProcessLogic = (input: NormalizeInput) => {
  action: string;
  output: string | null;
  param?: string;
};

export const NormalizeProcessSchema = (
  logic: NormalizeProcessLogic,
  log: LogDetail[],
) =>
  v.pipe(
    NormalizeInputSchema,
    v.transform((input: NormalizeInput) => {
      const result = logic(input);
      if (result.output !== null) {
        log.push({
          ...result,
          isValibotError: false,
          input: input.normalizedText,
          output: result.output,
        });
        return { ...input, normalizedText: result.output };
      } else {
        log.push({
          ...result,
          isValibotError: false,
          input: input.normalizedText,
          output: "do nothing",
        });
        return input;
      }
    }),
  );

export const ToSelectInputSchema = v.pipe(
  PreInputSchema,
  v.transform((input) => ({ ...input, selectedText: null })),
  SelectInputSchema,
);

export const ToNormalizeInputSchema = v.pipe(
  SelectInputSchema,
  v.transform((input) => ({
    ...input,
    normalizedText: input.selectedText,
  })),
  NormalizeInputSchema,
);

export const ToStringSchema = v.pipe(
  NormalizeInputSchema,
  v.transform((input) => input.normalizedText),
  v.string(),
);

/////////////////////////////////////////////////////////

export const preRemoveSpace: PreProcessLogic = ({ texts }: PreInput) => ({
  action: "preRemoveSpace",
  output: R.mapValues(texts, (text) => removeStringCore(text, spaceString)),
  param: spaceString,
});

export const preRemoveSplit1: PreProcessLogic = ({ texts }: PreInput) => ({
  action: "preRemoveSplit1",
  output: R.mapValues(texts, (text) => removeSplitChar1(text)),
  param: spaceString,
});

function removeSplitChar1(text: string): string {
  const split = text.split(" ");
  if (split.length === 1) {
    return text;
  } else {
    return split.filter((s) => s !== "1").join(" ");
  }
}

export const preRemoveSameChar: PreProcessLogic = ({ texts }: PreInput) => ({
  action: "preRemoveSameChar",
  output: R.mapValues(texts, (text) => removeSameChar(text)),
  param: spaceString,
});

function removeSameChar(text: string): string {
  return text.split("").reduce((acc, c) => acc.replaceAll(c, "") + c, text);
}

export const selectIfSameString: SelectProcessLogic = (input: SelectInput) => {
  const { original, grayscale, binary } = input.texts;
  let output: ImageLabel | null = null;
  if (original === grayscale && original === binary) {
    output = "original";
  } else if (original === grayscale) {
    output = "original";
  } else if (grayscale === binary) {
    output = "grayscale";
  } else if (binary === original) {
    output = "binary";
  } else {
    output = null;
  }

  return { action: "selectIfSameString", output: output };
};

const totalLevelRegExp = /レベル:\d{1,3}/;

export const selectTextIfMatchTotalLevelRegExp: SelectProcessLogic = (
  input: SelectInput,
) => ({
  action: "selectTextIfMatchTotalLevelRegExp",
  output: selectIfTestSuccess(input, (text) => totalLevelRegExp.test(text)),
  param: totalLevelRegExp.source,
});

function selectIfTestSuccess(
  { texts }: SelectInput,
  test: (text: string) => boolean,
): ImageLabel | null {
  const successList = R.pipe(
    texts,
    R.entries(),
    R.filter(([_, text]) => test(text)),
    R.map(([label]) => label),
  );
  for (const label of IMAGE_LABELS) {
    if (successList.includes(label)) return label;
  }
  return null;
}

// 主に刷り込み中向けの処理(り込み中見たくなる)
// ターゲットの半分以上の数の文字を検出している　かつ
// 検出した文字がすべて正しい時だけOK
export const selectTextIfPpartialMatchStatName: SelectProcessLogic = (
  input: SelectInput,
) => ({
  action: "selectTextIfPpartialMatchStatName",
  output: selectIfTestSuccess(
    input,
    (text) => partialMatchStatName(text) !== null,
  ),
});

const partialMatchStatName = (text: string): DisplayStatNameLabel | null =>
  R.pipe(
    DISPLAY_STAT_NAME_RECORD,
    R.entries(),
    R.filter(
      ([_, names]) =>
        R.pipe(
          names,
          R.filter(
            (name) =>
              name.length / 2 < text.length && text.length <= name.length,
          ),
          R.filter((name) => Array.from(text).every((c) => name.includes(c))),
        ).length > 0,
    ),
  )[0]?.[0] ?? null;

export const selectTextIfExactMatchStatName: SelectProcessLogic = (
  input: SelectInput,
) => ({
  action: "selectTextIfExactMatchStatName",
  output: selectIfTestSuccess(
    input,
    (text) =>
      R.pipe(
        DISPLAY_STAT_NAME_RECORD,
        R.entries(),
        R.filter(
          ([_, names]) =>
            R.pipe(
              names,
              R.filter((name) => name === text),
            ).length > 0,
        ),
      ).length > 0,
  ),
});

export const selectFallback: SelectProcessLogic = (_: SelectInput) => ({
  action: "selectFallback",
  output: "original",
});

// なんか1425.0/1425.0が1425.0/71425.0と1425.071425.0になったりするのでそれ用
export const selectIfDiffSlash: SelectProcessLogic = (input: SelectInput) => {
  const removed = R.mapValues(input.texts, (text) => text.replace("/", ""));
  const isSame = R.entries(removed).every(
    ([_, text]) => text === removed.original,
  );
  if (isSame) {
    return {
      action: "selectIfDiffSlash",
      output: selectIfTestSuccess(input, (text) => text === removed.original),
    };
  } else {
    return {
      action: "selectIfDiffSlash",
      output: null,
    };
  }
};

const nn_dot_n_slash_nn_dot_n = /^\d+\.\d\/\d+\.\d$/;

export const selectIf_nn_dot_n_slash_nn_dot_n: SelectProcessLogic = (
  input: SelectInput,
) => ({
  action: "nn_dot_n_slash_nn_dot_n",
  output: selectIfTestSuccess(input, (text) =>
    nn_dot_n_slash_nn_dot_n.test(text),
  ),
});

const nn_dot_n_7_nn_dot_n = /^\d+\.\d7\d+\.\d$/;

export const selectIf_nn_dot_n_7_nn_dot_n: SelectProcessLogic = (
  input: SelectInput,
) => ({
  action: "selectIf_nn_dot_n_7_nn_dot_n",
  output: selectIfTestSuccess(input, (text) => nn_dot_n_7_nn_dot_n.test(text)),
});

const nn_dot_n_parcent = /^\d+\.\d%$/;

export const selectIf_nn_dot_n_parcent: SelectProcessLogic = (
  input: SelectInput,
) => ({
  action: "selectIf_nn_dot_n_parcent",
  output: selectIfTestSuccess(input, (text) => nn_dot_n_parcent.test(text)),
});

const nn_parcent = /^\d+%$/;

export const selectIf_nn_parcent: SelectProcessLogic = (
  input: SelectInput,
) => ({
  action: "selectIf_nn_parcent",
  output: selectIfTestSuccess(input, (text) => nn_parcent.test(text)),
});

export const normalizeRemoveLevel: NormalizeProcessLogic = (
  input: NormalizeInput,
) => ({
  action: "normalizeRemoveLevel",
  output: removeStringCore(input.normalizedText, WHITE_LIST.level),
  param: WHITE_LIST.level,
});

const spaceString = " 　";
function removeStringCore(input: string, param: string): string {
  return Array.from(param).reduce((acc, v) => acc.replaceAll(v, ""), input);
}

export const normalizeStatName: NormalizeProcessLogic = ({
  normalizedText,
}: NormalizeInput) => {
  return {
    action: "normalizeStatName",
    output: partialMatchStatName(normalizedText),
  };
};

export const normalizeSplitIf_nn_dot_n_slash_nn_dot_n: NormalizeProcessLogic =
  ({ normalizedText }: NormalizeInput) => {
    let output = null;
    if (nn_dot_n_slash_nn_dot_n.test(normalizedText)) {
      const splitted = normalizedText.split("/")[1];
      if (splitted) output = splitted;
    }
    return {
      action: "normalizeSplitIf_nn_dot_n_slash_nn_dot_n",
      output,
    };
  };

const dotRegExp = /\./g;

export const normalizeSplitIf_nn_dot_n_7_nn_dot_n: NormalizeProcessLogic = ({
  normalizedText,
}: NormalizeInput) => {
  let output = null;
  if (nn_dot_n_7_nn_dot_n.test(normalizedText)) {
    const first = [...normalizedText.matchAll(dotRegExp)].map(
      (v) => v.index,
    )[0];
    if (first) output = normalizedText.slice(first + 3);
  }
  return {
    action: "normalizeSplitIf_nn_dot_n_7_nn_dot_n",
    output,
  };
};

const nn_dot_n_7_nn = /^\d+\.\d7\d+$/;

export const normalizeSplitIf_nn_dot_n_7_nn: NormalizeProcessLogic = ({
  normalizedText,
}: NormalizeInput) => {
  let output = null;
  if (nn_dot_n_7_nn.test(normalizedText)) {
    const first = [...normalizedText.matchAll(dotRegExp)].map(
      (v) => v.index,
    )[0];
    if (first) output = normalizedText.slice(first + 3);
  }
  return {
    action: "normalizeSplitIf_nn_dot_n_7_nn",
    output,
  };
};

export const normalizeAddDotIfNotExistDot: NormalizeProcessLogic = ({
  normalizedText,
}: NormalizeInput) => {
  let output = null;
  const dots = [...normalizedText.matchAll(dotRegExp)].map((v) => v.index);
  if (dots.length === 0)
    output = `${normalizedText.slice(0, -1)}.${normalizedText.slice(-1)}`;
  return {
    action: "normalizeAddDotIfNotExistDot",
    output,
  };
};

export const normalizeRemoveParcet: NormalizeProcessLogic = ({
  normalizedText,
}: NormalizeInput) => {
  let output = null;
  if (normalizedText.includes("%")) {
    output = normalizedText.replaceAll("%", "");
  }
  return {
    action: "normalizeRemoveParcet",
    output,
  };
};
