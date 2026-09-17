import "dotenv/config";
import { syncLegislativeData } from "../src/lib/legislation/sync";

async function main() {
  const args = process.argv.slice(2);
  const chamberArg = args.find((a) => a.startsWith("--chamber="));
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const chamber = chamberArg?.split("=")[1] as "senate" | "house" | undefined;
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

  if (!process.env.API_DATA_GOV_KEY) {
    console.error("Missing API_DATA_GOV_KEY. Set it in .env.local (server-side only).");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL.");
    process.exit(1);
  }

  console.log(
    `Syncing legislation from Congress.gov → PostgreSQL${
      chamber ? ` (${chamber})` : ""
    }${limit ? ` limit=${limit}` : ""}`
  );
  const result = await syncLegislativeData({
    chamber: chamber === "senate" || chamber === "house" ? chamber : undefined,
    limit: Number.isFinite(limit) ? limit : undefined,
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.status === "failed") process.exitCode = 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
