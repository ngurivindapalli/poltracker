import "dotenv/config";
import { getSenators } from "../src/lib/congressData";
import { getPrisma } from "../src/lib/db";
import { recordDatasetFreshness } from "../src/lib/sync/freshness";
import { fetchNewsApiEverything } from "../src/lib/newsApi";
import { upsertCachedNewsArticles } from "../src/lib/newsCache";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!process.env.NEWS_API_KEY?.trim()) {
    console.info("NEWS_API_KEY present: false");
    process.exit(1);
  }
  console.info("NEWS_API_KEY present: true");

  const prisma = await getPrisma();
  if (!prisma) {
    console.error("DATABASE_URL / Prisma unavailable");
    process.exit(1);
  }

  const senators = getSenators().slice(0, 100);
  let written = 0;
  const errors: string[] = [];
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);

  for (const member of senators) {
    const bid = String(member.bioguide_id || "").toUpperCase();
    const name = String(member.name || "").trim();
    if (!bid || !name) continue;

    try {
      const recent = await prisma.cachedNewsArticle.findFirst({
        where: { bioguideId: bid, fetchedAt: { gt: cutoff } },
        select: { id: true },
      });
      if (recent) continue;

      const query = `"${name}"`;
      const live = await fetchNewsApiEverything({
        q: query,
        pageSize: 8,
        context: `sync:${bid}`,
      });
      if (live.errorType && live.articles.length === 0) {
        errors.push(`${bid}: ${live.errorType}`);
        if (live.errorType === "rate_limited") break;
        await sleep(400);
        continue;
      }
      written += await upsertCachedNewsArticles(bid, live.articles);
    } catch (err) {
      errors.push(`${bid}: ${err instanceof Error ? err.name : "error"}`);
    }
    await sleep(350);
  }

  await recordDatasetFreshness({
    dataset: "news",
    status: errors.length && written === 0 ? "failed" : errors.length ? "partial" : "success",
    recordCount: written,
    successful: written > 0,
    error: errors.length ? errors.slice(0, 15).join("; ") : null,
  });

  console.log(JSON.stringify({ written, members: senators.length, errors: errors.slice(0, 20) }, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
