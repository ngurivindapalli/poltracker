/**
 * CLI: npm run sync:quiver [-- trades|networth|...]
 */
import "dotenv/config";
import { syncQuiverData } from "../src/services/quiver/syncAll";

const arg = process.argv[2];
const map: Record<string, string> = {
  trades: "trades",
  networth: "networth",
  donors: "donors",
  contracts: "contracts",
  lobbying: "lobbying",
  offexchange: "offexchange",
  trump: "trump",
  holdings: "holdings",
  summaries: "summaries",
};

async function main() {
  const only = arg && map[arg] ? [map[arg] as never] : undefined;
  if (arg !== "summaries" && !process.env.QUIVER_API_KEY) {
    console.error(
      "Missing QUIVER_API_KEY. Set it in .env or .env.local (see .env.example)."
    );
    process.exit(1);
  }

  console.log(
    only ? `Syncing dataset: ${arg}` : "Syncing ALL Quiver Hobbyist datasets..."
  );
  const results = await syncQuiverData({ only });
  console.log(JSON.stringify(results, null, 2));

  const failed = Object.values(results).filter((r) => r.status === "failed");
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
