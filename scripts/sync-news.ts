import "dotenv/config";
import { getSenators } from "../src/lib/congressData";
import { getPrisma } from "../src/lib/db";
import { recordDatasetFreshness } from "../src/lib/sync/freshness";
import { ideologyFromParty } from "../src/lib/ideology";
import { domainsForMode } from "../src/lib/newsSources";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.error("Missing NEWS_API_KEY");
    process.exit(1);
  }
  const prisma = await getPrisma();
  if (!prisma) {
    console.error("DATABASE_URL / Prisma unavailable");
    process.exit(1);
  }

  const senators = getSenators().slice(0, 100);
  let written = 0;
  const errors: string[] = [];

  for (const member of senators) {
    const bid = String(member.bioguide_id || "").toUpperCase();
    if (!bid) continue;
    const ideology = ideologyFromParty(member.party);
    const domains = domainsForMode(ideology, "balanced");
    const query = encodeURIComponent(`"${member.name}" ${member.state || ""}`.trim());
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=8&domains=${domains.join(",")}&apiKey=${apiKey}`;

    try {
      const response = await fetch(newsApiUrl, {
        headers: { "User-Agent": "Politeia/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        errors.push(`${bid}: HTTP ${response.status}`);
        await sleep(400);
        continue;
      }
      const data = await response.json();
      const articles = Array.isArray(data.articles) ? data.articles : [];
      const fetchedAt = new Date();
      for (const article of articles) {
        if (!article?.url || !article?.title) continue;
        await prisma.cachedNewsArticle.upsert({
          where: {
            bioguideId_url: { bioguideId: bid, url: String(article.url) },
          },
          create: {
            bioguideId: bid,
            title: String(article.title),
            url: String(article.url),
            source: article.source?.name || null,
            description: article.description || null,
            publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
            imageUrl: article.urlToImage || null,
            fetchedAt,
          },
          update: {
            title: String(article.title),
            source: article.source?.name || null,
            description: article.description || null,
            publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
            imageUrl: article.urlToImage || null,
            fetchedAt,
          },
        });
        written += 1;
      }
    } catch (err) {
      errors.push(`${bid}: ${err instanceof Error ? err.message : "error"}`);
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
