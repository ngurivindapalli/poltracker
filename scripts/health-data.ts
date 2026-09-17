import "dotenv/config";
import { getPrisma } from "../src/lib/db";
import { getDatasetFreshness } from "../src/lib/sync/freshness";
import { getSenatorSummaries } from "../src/lib/senators/summaries";
import { getRepresentativeSummaries } from "../src/lib/representatives/summaries";

function line(label: string, ok: boolean, extra = "") {
  console.log(`${label}: ${ok ? "OK" : "FAIL"}${extra ? `\n${extra}` : ""}`);
}

async function main() {
  const prisma = await getPrisma();
  line("DATABASE", Boolean(prisma), prisma ? "" : "  DATABASE_URL missing or Prisma unavailable");

  const congressConfigured = Boolean(process.env.API_DATA_GOV_KEY);
  line(
    "CONGRESS.GOV CONFIG",
    congressConfigured,
    congressConfigured ? "  API_DATA_GOV_KEY present (value hidden)" : "  API_DATA_GOV_KEY missing"
  );

  const quiverConfigured = Boolean(process.env.QUIVER_API_KEY);
  line(
    "QUIVER CONFIG",
    quiverConfigured,
    quiverConfigured ? "  QUIVER_API_KEY present (value hidden)" : "  QUIVER_API_KEY missing"
  );

  const newsConfigured = Boolean(process.env.NEWS_API_KEY);
  line(
    "NEWS CONFIG",
    newsConfigured,
    newsConfigured ? "  NEWS_API_KEY present (value hidden)" : "  NEWS_API_KEY missing"
  );

  let billCount = 0;
  if (prisma?.memberBill) {
    try {
      billCount = await prisma.memberBill.count();
    } catch {
      billCount = 0;
    }
  }
  const legisFresh = await getDatasetFreshness("legislation");
  line(
    "LEGISLATIVE DATA",
    billCount > 0 || Boolean(legisFresh?.lastSuccessfulSync),
    `  Records: ${billCount}\n  Last successful sync: ${legisFresh?.lastSuccessfulSync || "never"}`
  );

  const quiverFresh = await getDatasetFreshness("congress_trades");
  line(
    "QUIVER",
    quiverConfigured || Boolean(quiverFresh?.lastSuccessfulSync),
    `  Last successful sync: ${quiverFresh?.lastSuccessfulSync || "see warehouse / DataSyncLog"}`
  );

  const senators = await getSenatorSummaries();
  line("SENATORS", senators.count >= 50, `  Count: ${senators.count}`);

  const reps = await getRepresentativeSummaries();
  line("REPRESENTATIVES", reps.count >= 50, `  Count: ${reps.count}`);

  let nwCount = 0;
  if (prisma?.politicianNetWorth) {
    try {
      nwCount = await prisma.politicianNetWorth.count();
    } catch {
      nwCount = 0;
    }
  }
  line("FINANCIAL RECORDS", nwCount > 0 || senators.count > 0, `  Net-worth rows: ${nwCount}`);

  let newsCount = 0;
  if (prisma?.cachedNewsArticle) {
    try {
      newsCount = await prisma.cachedNewsArticle.count();
    } catch {
      newsCount = 0;
    }
  }
  const newsFresh = await getDatasetFreshness("news");
  line(
    "NEWS DATA",
    newsCount > 0 || Boolean(newsFresh?.lastSuccessfulSync),
    `  Records: ${newsCount}\n  Last successful sync: ${newsFresh?.lastSuccessfulSync || "never"}`
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
