import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { formatSyncReport, syncLocalElections } from "../src/lib/localElections/sync";

function argValue(args: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const matched = args.find((a) => a.startsWith(prefix));
  if (matched) return matched.slice(prefix.length);
  const idx = args.findIndex((a) => a === `--${name}`);
  if (idx >= 0 && args[idx + 1] && !args[idx + 1].startsWith("--")) return args[idx + 1];
  return undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const states = args
    .filter((a) => a.startsWith("--state="))
    .map((a) => a.slice("--state=".length).toUpperCase());
  const stateIdx = args.findIndex((a) => a === "--state");
  if (stateIdx >= 0 && args[stateIdx + 1] && !args[stateIdx + 1].startsWith("--")) {
    states.push(args[stateIdx + 1].toUpperCase());
  }
  const county = argValue(args, "county") || (args.includes("--county") ? args[args.indexOf("--county") + 1] : undefined);
  const yearRaw = argValue(args, "year");
  const batchRaw = argValue(args, "batch");
  const sourceRaw = (argValue(args, "source") || "").toLowerCase();
  const levelRaw = (argValue(args, "level") || "").toLowerCase();
  const dryRun = args.includes("--dry-run");
  const includeRaw = (argValue(args, "include-contests") || "").toLowerCase();
  const includeContests = includeRaw === "false" || includeRaw === "0" ? false : true;
  const force = args.includes("--force");
  const year = yearRaw ? Number(yearRaw) : 2026;
  const batch = batchRaw ? Number(batchRaw) : undefined;
  const source =
    sourceRaw === "official" || sourceRaw === "fec" ? sourceRaw : "all";
  const level =
    levelRaw === "federal" || levelRaw === "state" || levelRaw === "county"
      ? levelRaw
      : undefined;

  if (!process.env.DATABASE_URL && !dryRun) {
    console.error("Missing DATABASE_URL.");
    process.exit(1);
  }

  const report = await syncLocalElections({
    states: states.length ? states : undefined,
    county,
    dryRun,
    force,
    year: Number.isFinite(year) ? year : 2026,
    batch: batch && Number.isFinite(batch) ? batch : undefined,
    source,
    level,
    includeContests,
  });
  console.log(formatSyncReport(report));
  if (report.sourceFailures > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
