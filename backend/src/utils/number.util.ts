/**
 * Safely converts env values to positive numbers
 * Falls back to defaultValue on invalid input
 */
export const toNumber = (
  value: string | undefined,
  defaultValue: number
): number => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : defaultValue;
};
