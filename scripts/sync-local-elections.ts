import "dotenv/config";
import { formatSyncReport, syncLocalElections } from "../src/lib/localElections/sync";

function argValue(args: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const matched = args.find((a) => a.startsWith(prefix));
  return matched?.slice(prefix.length);
}

async function main() {
  const args = process.argv.slice(2);
  const states = args
    .filter((a) => a.startsWith("--state="))
    .map((a) => a.slice("--state=".length).toUpperCase());
  const county = argValue(args, "county");
  const yearRaw = argValue(args, "year");
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const year = yearRaw ? Number(yearRaw) : 2026;

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
  });
  console.log(formatSyncReport(report));
  if (report.sourceFailures > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
