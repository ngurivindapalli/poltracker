import fs from "fs";
import cheerio from "cheerio";

async function scrape() {
  console.log("Scraping Quiver net worth page...");

  const res = await fetch("https://www.quiverquant.com/congress-live-net-worth/");
  const html = await res.text();

  const $ = cheerio.load(html);

  const results: any[] = [];

  $("table tbody tr").each((_, el) => {
    const cols = $(el).find("td");

    const name = $(cols[0]).text().trim();
    const netWorthText = $(cols[2]).text().trim();

    // Convert "$1.2M" → number
    const netWorth = parseMoney(netWorthText);

    results.push({
      name,
      netWorth,
    });
  });

  fs.writeFileSync(
    "data/networth.json",
    JSON.stringify(results, null, 2)
  );

  console.log("✅ Saved net worth data");
}

function parseMoney(value: string): number {
  if (!value) return 0;

  const cleaned = value.replace(/[$,]/g, "").trim();

  if (cleaned.includes("M")) {
    return parseFloat(cleaned) * 1_000_000;
  }

  if (cleaned.includes("K")) {
    return parseFloat(cleaned) * 1_000;
  }

  return Number(cleaned) || 0;
}

scrape();
