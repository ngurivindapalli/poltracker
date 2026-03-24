const { chromium } = require("playwright");
const fs = require("fs");

async function scrape() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🚀 Loading Congress Live Net Worth page...");

  await page.goto("https://www.quiverquant.com/congress-live-net-worth/", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // Wait for table to load (data is JS-rendered)
  await page.waitForSelector("table tbody tr", { timeout: 15000 }).catch(() => null);

  const results = await page.evaluate(() => {
    const rows = document.querySelectorAll("table tbody tr");
    return Array.from(rows).map((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) return null;
      const netWorth = Array.from(cells)
        .map((c) => c.innerText?.trim() || "")
        .find((t) => t && t.startsWith("$"));
      // Politician name: from link href like /congresstrading/politician/Name-Id
      const link = row.querySelector('a[href*="/politician/"]');
      let name = null;
      if (link) {
        const href = link.getAttribute("href") || "";
        const match = href.match(/\/politician\/([^-]+(?:-[^-]+)*?)(?:-|$)/);
        if (match) name = decodeURIComponent(match[1].replace(/-/g, " "));
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
      return { name, netWorth };
    }).filter(Boolean);
  });

  await browser.close();

  const filtered = results.filter((r) => r.name && r.name.length > 2);

  const dataDir = "data";
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync("data/networth.json", JSON.stringify(filtered, null, 2));

  console.log(`✅ Done. Saved ${filtered.length} politicians to data/networth.json`);
}

scrape().catch((err) => {
  console.error("❌ Scrape failed:", err.message);
  process.exit(1);
});
