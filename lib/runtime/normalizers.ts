import { MISSING_VALUE } from "@/lib/contracts";

export function normalizeText(value: string | undefined | null): string {
  if (!value || value.trim().length === 0) {
    return MISSING_VALUE;
  }
  return value.trim();
}

export function normalizeList(values: Array<string | undefined | null> | undefined): string[] {
  if (!values || values.length === 0) {
    return [MISSING_VALUE];
  }

  const normalized = values.map((value) => normalizeText(value)).filter(Boolean);
  return normalized.length > 0 ? normalized : [MISSING_VALUE];
}

export function isMissingValue(value: string): boolean {
  return value === MISSING_VALUE;
}
