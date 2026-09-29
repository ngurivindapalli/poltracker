import { countySlug, normalizeCountyQuery } from "@/lib/localData/countySearch";
import { COMPILED_SOURCE_NAME } from "./types";

export function isCompiledSource(name: string | null | undefined): boolean {
  return (name || "") === COMPILED_SOURCE_NAME;
}

export function isOfficialSource(name: string | null | undefined): boolean {
  const value = (name || "").trim();
  return value.length > 0 && !isCompiledSource(value);
}

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return null;
  const d = new Date(`${trimmed.slice(0, 10)}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function electionStatus(date: Date | null, now = new Date()): string {
  if (!date) return "scheduled";
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return date.getTime() < start.getTime() ? "completed" : "scheduled";
}

export function countySourceKey(state: string, slug: string): string {
  return `county:${state.toUpperCase()}:${slug}`;
}

export function electionSourceKey(parts: Array<string | number | null | undefined>): string {
  return parts
    .map((p) => String(p ?? "").trim().toLowerCase())
    .join("|");
}

export function toCountyRecord(state: string, countyName: string) {
  return {
    state: state.toUpperCase(),
    countyName,
    normalizedName: normalizeCountyQuery(countyName),
    slug: countySlug(countyName),
  };
}
