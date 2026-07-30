/**
 * Ingest FEC candidate cycle totals for members with an fec_candidate_id.
 *
 * Docs: https://api.open.fec.gov/developers/
 * Key:  https://api.data.gov/signup/  → set FEC_API_KEY in .env
 *
 * Itemized donors (/schedules/schedule_a/) live in scripts/ingest-fec-donors.ts —
 * do not fold that high-volume path into this script.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "./lib/prisma";

const FEC_BASE = "https://api.open.fec.gov/v1";
const DELAY_MS = 4_000; // stay under ~1000 req/hr on a free data.gov key
const ERROR_LOG = path.join(process.cwd(), "logs", "fec-ingest-errors.log");

type FecTotalRow = {
  cycle?: number;
  receipts?: number | null;
  disbursements?: number | null;
  last_cash_on_hand_end_period?: number | null;
  cash_on_hand_end_period?: number | null;
  committee_designation?: string | null;
  election_full?: boolean | null;
};

type FecTotalsResponse = {
  results?: FecTotalRow[];
  error?: { message?: string };
  message?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toBigIntDollars(value: number | null | undefined): bigint | null {
  if (value == null || Number.isNaN(value)) return null;
  return BigInt(Math.round(value));
}

function pickMostRecentTotal(rows: FecTotalRow[]): FecTotalRow | null {
  if (!rows.length) return null;

  const ranked = [...rows].sort((a, b) => {
    const cycleDiff = (b.cycle ?? 0) - (a.cycle ?? 0);
    if (cycleDiff !== 0) return cycleDiff;
    // Prefer principal campaign committee when same cycle
    const aP = a.committee_designation === "P" ? 1 : 0;
    const bP = b.committee_designation === "P" ? 1 : 0;
    return bP - aP;
  });

  return ranked[0] ?? null;
}

function appendError(line: string) {
  fs.mkdirSync(path.dirname(ERROR_LOG), { recursive: true });
  fs.appendFileSync(ERROR_LOG, `${new Date().toISOString()} ${line}\n`, "utf8");
}

async function fetchCandidateTotals(
  fecCandidateId: string,
  apiKey: string
): Promise<FecTotalRow | null> {
  const url = new URL(`${FEC_BASE}/candidate/${encodeURIComponent(fecCandidateId)}/totals/`);
  url.searchParams.set("api_key", apiKey);
  // Two-year cycles populate `cycle`; election_full=true often leaves it null.
  url.searchParams.set("election_full", "false");
  url.searchParams.set("sort", "-cycle");
  url.searchParams.set("per_page", "20");

  const res = await fetch(url);
  const body = (await res.json()) as FecTotalsResponse;

  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status}: ${body.error?.message ?? body.message ?? res.statusText}`
    );
  }

  return pickMostRecentTotal(body.results ?? []);
}

async function main() {
  const apiKey = process.env.FEC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "FEC_API_KEY is not set. Get a free key at https://api.data.gov/signup/ and add it to .env"
    );
  }

  const members = await prisma.member.findMany({
    where: { fecCandidateId: { not: null } },
    select: {
      bioguideId: true,
      fecCandidateId: true,
      firstName: true,
      lastName: true,
    },
    orderBy: { lastName: "asc" },
  });

  console.log(`Ingesting FEC totals for ${members.length} members (delay ${DELAY_MS}ms)...`);
  console.log(`Failures will be appended to ${ERROR_LOG}`);

  let ok = 0;
  let empty = 0;
  let failed = 0;

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const fecId = member.fecCandidateId!;
    const label = `${member.lastName}, ${member.firstName} (${member.bioguideId} / ${fecId})`;

    try {
      const total = await fetchCandidateTotals(fecId, apiKey);

      if (!total?.cycle) {
        empty += 1;
        appendError(`NO_TOTALS ${label}`);
        console.log(`[${i + 1}/${members.length}] no totals — ${label}`);
      } else {
        await prisma.fecTotal.upsert({
          where: {
            bioguideId_cycle: {
              bioguideId: member.bioguideId,
              cycle: total.cycle,
            },
          },
          create: {
            bioguideId: member.bioguideId,
            cycle: total.cycle,
            receipts: toBigIntDollars(total.receipts),
            disbursements: toBigIntDollars(total.disbursements),
            cashOnHand: toBigIntDollars(
              total.last_cash_on_hand_end_period ?? total.cash_on_hand_end_period
            ),
          },
          update: {
            receipts: toBigIntDollars(total.receipts),
            disbursements: toBigIntDollars(total.disbursements),
            cashOnHand: toBigIntDollars(
              total.last_cash_on_hand_end_period ?? total.cash_on_hand_end_period
            ),
          },
        });
        ok += 1;
        console.log(
          `[${i + 1}/${members.length}] cycle ${total.cycle} — ${label}`
        );
      }
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      appendError(`ERROR ${label} — ${message}`);
      console.error(`[${i + 1}/${members.length}] FAILED — ${label}: ${message}`);
    }

    if (i < members.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`Done. upserted=${ok} empty=${empty} failed=${failed}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
