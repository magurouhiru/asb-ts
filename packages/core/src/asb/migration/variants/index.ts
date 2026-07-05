import * as v from "valibot";
import { AllModSpecies } from "../values/index.js";

export { VARIANT_DEFAULT_UNSELECTED } from "./default-unselected.js";

export const Varians = new Set(
  AllModSpecies.flatMap((s) => s.species)
    .map((s) => s.variants)
    .filter((v) => !!v)
    .flat(),
);

export type Variant = v.InferOutput<typeof VariantSchema>;
export const VariantSchema = v.picklist([...Varians]);
