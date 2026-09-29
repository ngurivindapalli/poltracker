import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import {
  auditLocalElectionCoverage,
  formatAuditDetail,
  formatCoverageReport,
} from "../src/lib/localElections/audit";
import { PA_COUNTY_BOARD_SOURCES } from "../src/lib/localElections/inventories/paCountyBoards";
import { formatInventoryReport } from "../src/lib/localElections/inventory";
import { formatContestCoverageReport, loadContestCoverageSnapshot } from "../src/lib/localElections/contestCoverage";
import {
  formatThreeLevelCoverageReport,
  threeLevelJsonSummary,
} from "../src/lib/localElections/threeLevelReport";

async function main() {
  const args = process.argv.slice(2);
  const detail = args.includes("--detail");
  const json = args.includes("--json");
  const rows = await auditLocalElectionCoverage();
  const contestSnapshot = await loadContestCoverageSnapshot();
  if (json) {
    console.log(
      JSON.stringify(
        {
          ...threeLevelJsonSummary(rows),
          contests: contestSnapshot,
        },
        null,
        2
      )
    );
    return;
  }
  console.log(formatCoverageReport(rows));
  console.log("");
  console.log(formatThreeLevelCoverageReport(rows));
  console.log("");
  console.log(formatContestCoverageReport(contestSnapshot));
  const pa = rows.find((r) => r.stateCode === "PA");
  console.log("");
  console.log(
    formatInventoryReport("Pennsylvania county-board inventory", PA_COUNTY_BOARD_SOURCES, {
      countyEquivalents: pa?.countyCount,
      countyElections: pa?.officialCountyElections,
    })
  );
  if (detail) {
    console.log("");
    console.log(formatAuditDetail(rows));
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
