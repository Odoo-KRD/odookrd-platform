export const NUMBER_FEATURE_UNITS = [
  "users",
  "instances",
  "domains",
  "hours",
  "days",
  "months",
  "cores",
  "seats",
] as const;

export const STORAGE_FEATURE_UNITS = ["MB", "GB", "TB"] as const;

const availableUnits = new Set<string>([
  ...NUMBER_FEATURE_UNITS,
  ...STORAGE_FEATURE_UNITS,
]);

export type NumberFeatureUnit = (typeof NUMBER_FEATURE_UNITS)[number];

export function isPredefinedFeatureUnit(value: string): boolean {
  return availableUnits.has(value);
}
