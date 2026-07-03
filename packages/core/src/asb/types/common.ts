import * as v from "valibot";

export type PositiveNumber = v.InferOutput<typeof PositiveNumberSchema>;
export const PositiveNumberSchema = v.pipe(
  v.number(),
  v.minValue(0),
  v.brand("" as "PositiveNumberSchema"),
);
export const POSITIVE_NUMBER_0 = 0 as PositiveNumber;

export type PositiveInteger = v.InferOutput<typeof PositiveIntegerSchema>;
export const PositiveIntegerSchema = v.pipe(
  v.number(),
  v.minValue(0),
  v.integer(),
  v.brand("" as "PositiveIntegerSchema"),
);
export const POSITIVE_INTEGER_0 = 0 as PositiveInteger;
