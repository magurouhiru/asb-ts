import { expect, test } from "vitest";
import { calcL, getSpeciesList, searchSpecies } from "./index.js";

test.each([
  [
    {
      name: "ハキリノサウルス",
      health: 825.0,
      stamina: 300.0,
      oxygen: 225.0,
      food: 6300.0,
      weight: 445.3,
      meleeDamageMultiplier: 1.3,
      torpidity: 985.0,
    },
    [6, 10, 5, 11, 11, 6, 49, [], "ASA"],
  ],
  [
    {
      name: "カブロスクス",
      health: 1000.0,
      stamina: 840.0,
      oxygen: 0,
      food: 2640.0,
      weight: 184.8,
      meleeDamageMultiplier: 1.85,
      torpidity: 1148.0,
    },
    [20, 14, 0, 12, 16, 17, 79, [], "ASA"],
  ],
  [
    {
      name: "ティラノサウルス",
      health: 5720.0,
      stamina: 1554.0,
      oxygen: 555.0,
      food: 7200.0,
      weight: 750.0,
      meleeDamageMultiplier: 2.5,
      torpidity: 14942.0,
    },
    [21, 27, 27, 14, 25, 30, 144, [], "ASA"],
  ],
  [
    {
      name: "マナガルム",
      health: 2310.0,
      stamina: 480.0,
      oxygen: 270.0,
      food: 3800.0,
      weight: 348.0,
      meleeDamageMultiplier: 1.45,
      torpidity: 3152.0,
    },
    [9, 6, 8, 9, 8, 9, 49, ["Extinction"], "ASA"],
  ],
  [
    {
      name: "雪フクロウ",
      health: 2015.0,
      stamina: 1225.0,
      oxygen: 510.0,
      food: 6200.0,
      weight: 562.5,
      meleeDamageMultiplier: 1.9,
      torpidity: 5604.0,
    },
    [26, 25, 24, 21, 25, 18, 139, ["Extinction"], "ASA"],
  ],
])("calcL - $name", (inputs, expected) => {
  const speciesList = getSpeciesList();
  const s = searchSpecies(speciesList, inputs.name);
  if (!s) throw new Error("なんかへん");
  const r = calcL(speciesList, { ...inputs, bp: s.blueprintPath });
  if (!r) throw new Error("なんかへん");
  const { species, result } = r;

  expect(result.health.wild).toBe(expected[0]);
  expect(result.stamina.wild).toBe(expected[1]);
  expect(result.oxygen.wild).toBe(expected[2]);
  expect(result.food.wild).toBe(expected[3]);
  expect(result.weight.wild).toBe(expected[4]);
  expect(result.meleeDamageMultiplier.wild).toBe(expected[5]);
  expect(result.torpidity.wild).toBe(expected[6]);

  expect(result.health.error).toBe(null);
  expect(result.stamina.error).toBe(null);
  expect(result.oxygen.error).toBe(null);
  expect(result.food.error).toBe(null);
  expect(result.weight.error).toBe(null);
  expect(result.meleeDamageMultiplier.error).toBe(null);
  expect(result.torpidity.error).toBe(null);

  expect(species.variants).toStrictEqual(expected[7]);
  expect(species.mod).toBe(expected[8]);
});
