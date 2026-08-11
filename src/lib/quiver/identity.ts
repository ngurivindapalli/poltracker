/**
 * BioGuideID-first politician identity resolution for Quiver datasets.
 * Name matching is secondary, unambiguous-only, and logged when ambiguous.
 */

import { cleanStr, normalizeBio, normalizeNameKey } from "./normalizers";
import type { NormalizedNetWorth } from "./types";

export type ResolveStatus =
  | "direct_bioguide"
  | "name_unique"
  | "name_chamber"
  | "ambiguous"
  | "unmatched";

export type ResolveResult = {
  bioguideId: string | null;
  status: ResolveStatus;
  candidates?: string[];
};

export type PoliticianIdentity = {
  bioguideId: string;
  name: string;
  party: string | null;
  chamber: string | null;
  state: string | null;
  tradeCount: number | null;
  tradeVolume: number | null;
  netWorth: number | null;
};

/** Strip middle initials / suffixes for loose keys (e.g. "cory a booker" → "cory booker"). */
export function coreNameKey(name: string): string {
  const raw = cleanStr(name) || "";
  // Handle "Last, First M." before stripping punctuation
  if (raw.includes(",")) {
    const [lastPart, restPart] = raw.split(",").map((s) => s.trim());
    const restToks = normalizeNameKey(restPart || "")
      .split(" ")
      .filter(
        (t) =>
          t.length > 1 &&
          !["jr", "sr", "ii", "iii", "iv", "md", "phd"].includes(t)
      );
    const lastToks = normalizeNameKey(lastPart || "")
      .split(" ")
      .filter(Boolean);
    const first = restToks[0] || "";
    const last = lastToks[lastToks.length - 1] || "";
    return normalizeNameKey(`${first} ${last}`);
  }

  const key = normalizeNameKey(raw);
  // drop single-letter tokens (middle initials) and common suffixes
  const toks = key
    .split(" ")
    .filter(
      (t) =>
        t.length > 1 &&
        !["jr", "sr", "ii", "iii", "iv", "md", "phd"].includes(t)
    );
  return toks.join(" ");
}

export function chamberKey(chamber: string | null | undefined): string {
  const c = (chamber || "").toLowerCase();
  if (c.includes("sen")) return "senate";
  if (c.includes("rep") || c.includes("house")) return "house";
  if (c.includes("cand")) return "candidate";
  return c || "unknown";
}

export class PoliticianIndex {
  readonly byBio = new Map<string, PoliticianIdentity>();
  /** core name -> bios (may be ambiguous) */
  private byCoreName = new Map<string, string[]>();
  /** core name + chamber -> bios */
  private byCoreNameChamber = new Map<string, string[]>();

  add(p: PoliticianIdentity) {
    const bio = normalizeBio(p.bioguideId);
    if (!bio) return;
    this.byBio.set(bio, { ...p, bioguideId: bio });

    const core = coreNameKey(p.name);
    if (!core) return;
    pushMap(this.byCoreName, core, bio);

    const ck = `${core}|${chamberKey(p.chamber)}`;
    pushMap(this.byCoreNameChamber, ck, bio);

    // also full normalizeNameKey
    const full = normalizeNameKey(p.name);
    if (full && full !== core) {
      pushMap(this.byCoreName, full, bio);
      pushMap(this.byCoreNameChamber, `${full}|${chamberKey(p.chamber)}`, bio);
    }
  }

  static fromNetWorth(rows: NormalizedNetWorth[]): PoliticianIndex {
    const idx = new PoliticianIndex();
    for (const r of rows) {
      idx.add({
        bioguideId: r.bioguideId,
        name: r.name,
        party: r.party,
        chamber: r.chamber,
        state: r.state,
        tradeCount: r.tradeCount,
        tradeVolume: r.tradeVolume,
        netWorth: r.netWorth,
      });
    }
    return idx;
  }

  get(bioguideId: string): PoliticianIdentity | undefined {
    return this.byBio.get(normalizeBio(bioguideId) || "");
  }

  resolve(input: {
    bioguideId?: string | null;
    name?: string | null;
    chamber?: string | null;
    party?: string | null;
    state?: string | null;
  }): ResolveResult {
    const direct = normalizeBio(input.bioguideId);
    if (direct && this.byBio.has(direct)) {
      return { bioguideId: direct, status: "direct_bioguide" };
    }
    // API may provide BioGuideID even if not yet in roster
    if (direct) {
      return { bioguideId: direct, status: "direct_bioguide" };
    }

    const name = cleanStr(input.name);
    if (!name) return { bioguideId: null, status: "unmatched" };

    const core = coreNameKey(name);
    const chamber = chamberKey(input.chamber);

    // Prefer chamber-qualified unique match
    const chamberHits = this.byCoreNameChamber.get(`${core}|${chamber}`) || [];
    const uniqueChamber = unique(chamberHits);
    if (uniqueChamber.length === 1) {
      return { bioguideId: uniqueChamber[0], status: "name_chamber" };
    }
    if (uniqueChamber.length > 1) {
      // try party/state disambiguation
      const filtered = uniqueChamber.filter((bio) => {
        const p = this.byBio.get(bio);
        if (!p) return false;
        if (input.party && p.party) {
          const a = p.party[0]?.toLowerCase();
          const b = input.party[0]?.toLowerCase();
          if (a && b && a !== b && !partyLooseEqual(p.party, input.party)) {
            return false;
          }
        }
        if (input.state && p.state) {
          if (!stateLooseEqual(p.state, input.state)) return false;
        }
        return true;
      });
      if (filtered.length === 1) {
        return { bioguideId: filtered[0], status: "name_chamber" };
      }
      return {
        bioguideId: null,
        status: "ambiguous",
        candidates: uniqueChamber,
      };
    }

    const nameHits = unique(this.byCoreName.get(core) || []);
    if (nameHits.length === 1) {
      return { bioguideId: nameHits[0], status: "name_unique" };
    }
    if (nameHits.length > 1) {
      return { bioguideId: null, status: "ambiguous", candidates: nameHits };
    }

    return { bioguideId: null, status: "unmatched" };
  }
}

function pushMap(map: Map<string, string[]>, key: string, bio: string) {
  const arr = map.get(key) || [];
  if (!arr.includes(bio)) arr.push(bio);
  map.set(key, arr);
}

function unique(arr: string[]): string[] {
  return [...new Set(arr)];
}

function partyLooseEqual(a: string, b: string): boolean {
  const na = a.toLowerCase();
  const nb = b.toLowerCase();
  if (na.startsWith("d") && nb.startsWith("d")) return true;
  if (na.startsWith("r") && nb.startsWith("r")) return true;
  if (na.includes("dem") && nb.includes("dem")) return true;
  if (na.includes("rep") && nb.includes("rep")) return true;
  return na === nb;
}

function stateLooseEqual(a: string, b: string): boolean {
  const na = a.toLowerCase().replace(/[^a-z]/g, "");
  const nb = b.toLowerCase().replace(/[^a-z]/g, "");
  return na === nb || na.startsWith(nb) || nb.startsWith(na);
}
