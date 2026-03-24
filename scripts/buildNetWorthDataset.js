const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

// Load congress dataset for bioguideId lookup (when Quiver doesn't provide it)
const legislatorsPath = path.join(__dirname, "..", "data", "poltracker_congress_dataset.json");
const legislators = JSON.parse(fs.readFileSync(legislatorsPath, "utf8"));

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z ]/g, "").trim();
}

function findBioguideByName(name) {
  const n = normalizeName(name);
  const match = legislators.find((p) => normalizeName(p.name) === n);
  return match?.bioguide_id || match?.bioguideId || null;
}

async function scrape() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🚀 Loading Congress Live Net Worth page...");

  await page.goto("https://www.quiverquant.com/congress-live-net-worth/", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  await page.waitForSelector("table tbody tr", { timeout: 15000 }).catch(() => null);

  const rawResults = await page.evaluate(() => {
    const rows = document.querySelectorAll("table tbody tr");
    return Array.from(rows).map((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) return null;
      const netWorth = Array.from(cells)
        .map((c) => c.innerText?.trim() || "")
        .find((t) => t && t.startsWith("$"));
      const link = row.querySelector('a[href*="/politician/"]');
      let name = null;
      let bioguideId = null;
      if (link) {
        const href = link.getAttribute("href") || "";
        const pathPart = decodeURIComponent(href.split("/politician/")[1]?.split("?")[0] || "");
        const bioguideMatch = pathPart.match(/([A-Z]\d{6})/i);
        if (bioguideMatch) {
          bioguideId = bioguideMatch[1];
          const beforeId = pathPart.substring(0, pathPart.indexOf(bioguideId)).replace(/\/$/, "").replace(/-$/, "");
          name = beforeId.replace(/-/g, " ").trim();
        }
      }
      if (!name) {
        const texts = Array.from(cells).map((c) => c.innerText?.trim() || "");
        const skip = ["Live Portfolio", "Live", "Portfolio"];
        name = texts.find(
          (t) =>
            t &&
            !t.startsWith("$") &&
            !t.match(/^[+\-]?\s*[\d.,]+\s*[KMB]?$/) &&
            !skip.includes(t) &&
            t.length > 3
        );
      }
      if (!name || !netWorth) return null;
      return { name, netWorth, bioguideId };
    }).filter(Boolean);
  });

  await browser.close();

  const results = rawResults
    .filter((r) => r.name && r.name.length > 2)
    .map((r) => ({
      name: r.name,
      bioguideId: r.bioguideId || findBioguideByName(r.name),
      netWorth: r.netWorth,
    }));

  const dataDir = path.join(__dirname, "..", "data");
  const srcDataDir = path.join(__dirname, "..", "src", "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(srcDataDir)) fs.mkdirSync(srcDataDir, { recursive: true });

  const output = JSON.stringify(results, null, 2);
  fs.writeFileSync(path.join(dataDir, "networth.json"), output);
  fs.writeFileSync(path.join(srcDataDir, "networth.json"), output);

  const withBioguide = results.filter((r) => r.bioguideId).length;
  console.log(`✅ Finished. Saved ${results.length} entries (${withBioguide} with bioguideId)`);
}

scrape().catch((err) => {
  console.error("❌ Scrape failed:", err.message);
  process.exit(1);
});
