/**
 * Seed members from unitedstates/congress-legislators current roster.
 *
 * Source: https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.yaml
 */
import "dotenv/config";
import yaml from "js-yaml";
import { Chamber } from "../src/generated/prisma/client";
import { prisma } from "./lib/prisma";

const LEGISLATORS_URL =
  "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.yaml";

type LegislatorTerm = {
  type: "sen" | "rep";
  start: string;
  end?: string;
  state: string;
  district?: number;
  party?: string;
};

type Legislator = {
  id: {
    bioguide: string;
    fec?: string[];
  };
  name: {
    first: string;
    last: string;
  };
  terms: LegislatorTerm[];
};

function isCurrentTerm(term: LegislatorTerm, today: Date): boolean {
  if (!term.end) return true;
  // end dates in the YAML are inclusive calendar dates; treat end-of-day as still current
  const end = new Date(`${term.end}T23:59:59`);
  return end >= today;
}

function currentTerm(terms: LegislatorTerm[], today: Date): LegislatorTerm | null {
  const current = terms.filter((t) => isCurrentTerm(t, today));
  if (current.length === 0) return null;
  return current[current.length - 1];
}

function toChamber(type: LegislatorTerm["type"]): Chamber {
  return type === "sen" ? Chamber.senate : Chamber.house;
}

async function main() {
  console.log(`Fetching ${LEGISLATORS_URL} ...`);
  const res = await fetch(LEGISLATORS_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch legislators YAML: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  const legislators = yaml.load(text) as Legislator[];
  if (!Array.isArray(legislators)) {
    throw new Error("Expected legislators YAML to be an array");
  }

  const today = new Date();
  let senate = 0;
  let house = 0;
  let skipped = 0;

  for (const leg of legislators) {
    const bioguideId = leg.id?.bioguide;
    const term = currentTerm(leg.terms ?? [], today);

    if (!bioguideId || !term) {
      skipped += 1;
      continue;
    }

    const chamber = toChamber(term.type);
    const fecCandidateId = leg.id.fec?.[0] ?? null;

    await prisma.member.upsert({
      where: { bioguideId },
      create: {
        bioguideId,
        fecCandidateId,
        firstName: leg.name.first,
        lastName: leg.name.last,
        chamber,
        party: term.party ?? null,
        state: term.state,
        district: chamber === Chamber.house ? (term.district ?? null) : null,
        active: true,
      },
      update: {
        fecCandidateId,
        firstName: leg.name.first,
        lastName: leg.name.last,
        chamber,
        party: term.party ?? null,
        state: term.state,
        district: chamber === Chamber.house ? (term.district ?? null) : null,
        active: true,
      },
    });

    if (chamber === Chamber.senate) senate += 1;
    else house += 1;
  }

  console.log(`Seeded members — senate: ${senate}, house: ${house}, skipped: ${skipped}`);
  console.log(`Total upserted: ${senate + house}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
