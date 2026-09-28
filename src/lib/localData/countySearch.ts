export type CountyDirectoryRow = {
  name: string;
  slug: string;
  upcomingElections: number;
  localEvents: number;
  lastUpdated: string | null;
  sourceName: string | null;
};

export function countySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeCountyQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/\bcounty\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
