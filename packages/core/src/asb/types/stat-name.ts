export type StatLabel = (typeof STAT_LABELS)[number];
export const STAT_LABELS = [
  "health",
  "stamina",
  "oxygen",
  "food",

  "water",
  "temperature",
  "weight",
  "meleeDamageMultiplier",

  "speedMultiplier",
  "temperatureFortitude",
  "craftingSpeedMultiplier",
  "torpidity",
] as const;
