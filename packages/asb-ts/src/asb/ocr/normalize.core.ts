import * as R from "remeda";
import * as v from "valibot";
import {
  DISPLAY_STAT_NAME_RECORD,
  type ExtractedTextRecord,
  IMAGE_LABELS,
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
  output: ExtractedTextRecord;
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
        input: JSON.stringify(input.texts),
        output: JSON.stringify(result.output),
      });
      return { ...input, texts: result.output };
    }),
  );

export type SelectProcessLogic = (input: SelectInput) => {
  action: string;
  output: string | null;
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
      log.push({
        ...result,
        isValibotError: false,
        input: JSON.stringify(input.texts),
        output: result.output,
      });
      if (result.output !== null) {
        return { ...input, selectedText: result.output };
      } else {
        return input;
      }
    }),
  );

export type NormalizeProcessLogic = (input: NormalizeInput) => {
  action: string;
  output: string;
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
      log.push({
        ...result,
        isValibotError: false,
        input: input.normalizedText,
        output: result.output,
      });
      return { ...input, normalizedText: result.output };
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

export const preRemoveSplitChar: PreProcessLogic = ({ texts }: PreInput) => ({
  action: "preRemoveSplittedChar",
  output: R.mapValues(texts, (text) => removeSplitCharCore(text)),
  param: spaceString,
});

function removeSplitCharCore(text: string): string {
  const split = text.split(" ");
  if (split.length === 1) {
    return text;
  } else {
    return split.filter((s) => s.length !== 1).join(" ");
  }
}

export const selectIfSameString: SelectProcessLogic = (input: SelectInput) => {
  const { original, grayscale, binary } = input.texts;
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

export const selectTextIfMatchTotalLevelRegExp: SelectProcessLogic = (
  input: SelectInput,
) => ({
  action: "selectTextIfMatchTotalLevelRegExp",
  output: selectIfTestSuccess(input, totalLevelRegExp.test),
  param: totalLevelRegExp.source,
});

function selectIfTestSuccess(
  { texts }: SelectInput,
  test: (text: string) => boolean,
): string | null {
  const successList = R.pipe(
    texts,
    R.entries(),
    R.filter(([_, text]) => test(text)),
    R.map(([label]) => label),
  );
  for (const label of IMAGE_LABELS) {
    if (successList.includes(label)) return texts[label];
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
    (text) =>
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
              R.filter((name) =>
                Array.from(text).every((c) => name.includes(c)),
              ),
            ).length > 0,
        ),
      ).length > 0,
  ),
});

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

export const selectFallback: SelectProcessLogic = (input: SelectInput) => ({
  action: "selectFallback",
  output: input.texts.original,
});

export const selectIfExistSlashBetweenDots: SelectProcessLogic = (
  input: SelectInput,
) => ({
  action: "selectIfExistSlashBetweenDots",
  output: selectIfTestSuccess(input, isExistSlashBetweenDots),
});

const slashRegExp = /\//g;
const dotRegExp = /\./g;
function isExistSlashBetweenDots(text: string): boolean {
  const slash = [...text.matchAll(slashRegExp)].map((v) => v.index);
  const dot = [...text.matchAll(dotRegExp)].map((v) => v.index);
  return (
    slash.length === 1 && dot.length === 2 && (dot[0] ?? -10) + 2 === slash[0]
  );
}

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

export const normalizeSplitIfExistSlashBetweenDots: NormalizeProcessLogic = ({
  normalizedText,
}: NormalizeInput) => {
  let output = normalizedText;
  if (isExistSlashBetweenDots(normalizedText)) {
    const splitted = normalizedText.split("/")[1];
    if (splitted) output = splitted;
  }
  return {
    action: "normalizeSplitIfExistSlashBetweenDots",
    output,
  };
};
