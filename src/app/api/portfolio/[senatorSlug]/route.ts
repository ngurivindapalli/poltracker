import fs from "fs";
import path from "path";

export const runtime = "nodejs";

function norm(s: string) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function slugify(name: string) {
  return norm(name).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function amountMidpoint(amount: string | undefined) {
  // Handle amount ranges like "$1,001 - $15,000" -> 8000
  if (!amount) return 0;
  const m = amount.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
  if (!m) return 0;
  const a = Number(m[1].replace(/,/g, ""));
  const b = Number(m[2].replace(/,/g, ""));
  if (!isFinite(a) || !isFinite(b)) return 0;
  return Math.round((a + b) / 2);
}

export async function GET(
  req: Request,
  { params }: { params: { senatorSlug: string } }
) {
  try {
    const slug = params.senatorSlug;

    const basePath = path.join(process.cwd(), "public", "data", "portfolio_timeseries");

    // Try to read precomputed files first
    const tsPath = path.join(basePath, `${slug}.json`);
    const summaryPath = path.join(basePath, `${slug}_summary.json`);
    const tradesPath = path.join(basePath, `${slug}_trades.json`);

    let timeseries: any[] = [];
    let summary: any = null;
    let trades: any[] = [];

    // Read precomputed timeseries
    if (fs.existsSync(tsPath)) {
      const tsData = fs.readFileSync(tsPath, "utf-8");
      timeseries = JSON.parse(tsData);
    }

    // Read precomputed summary
    if (fs.existsSync(summaryPath)) {
      const summaryData = fs.readFileSync(summaryPath, "utf-8");
      summary = JSON.parse(summaryData);
    }

    // Read precomputed trades
    if (fs.existsSync(tradesPath)) {
      const tradesData = fs.readFileSync(tradesPath, "utf-8");
      trades = JSON.parse(tradesData);
    }

    // If no precomputed data, fallback to deriving from senateTrades.json
    if (timeseries.length === 0) {
      const filePath = path.join(process.cwd(), "public", "data", "senateTrades.json");
      
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf8");
        const all = JSON.parse(raw) as any[];

        const rows = all.filter((t) => slugify(t.senator || "") === slug);

        if (rows.length > 0) {
          trades = rows;

          // Aggregate by month: trade count and estimated invested
          const byMonth: Record<string, { date: string; tradeCount: number; cumulativeTrades: number; invested: number }> = {};

          let cumulative = 0;
          for (const t of rows.sort((a, b) => (a.transactionDate || "").localeCompare(b.transactionDate || ""))) {
            const d = (t.transactionDate || "").slice(0, 10);
            if (!d || d.length < 7) continue;
            const ym = d.slice(0, 7); // YYYY-MM

            if (!byMonth[ym]) byMonth[ym] = { date: ym + "-01", tradeCount: 0, cumulativeTrades: 0, invested: 0 };
            byMonth[ym].tradeCount += 1;
            cumulative += 1;
            byMonth[ym].cumulativeTrades = cumulative;
            byMonth[ym].invested += amountMidpoint(t.amount);
          }

          timeseries = Object.values(byMonth).sort((a, b) => a.date.localeCompare(b.date));

          // Build summary
          const tickers: Record<string, number> = {};
          const assetTypes: Record<string, number> = {};
          const years: Record<string, number> = {};

          for (const t of rows) {
            if (t.ticker) {
              tickers[t.ticker] = (tickers[t.ticker] || 0) + 1;
            }
            if (t.assetType) {
              assetTypes[t.assetType] = (assetTypes[t.assetType] || 0) + 1;
            }
            const year = (t.transactionDate || "").slice(0, 4);
            if (year) {
              years[year] = (years[year] || 0) + 1;
            }
          }

          const topTickers = Object.entries(tickers)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([ticker, count]) => ({ ticker, count }));

          const sortedDates = rows
            .map(t => t.transactionDate)
            .filter(Boolean)
            .sort();

          summary = {
            senator: rows[0]?.senator || slug,
            slug,
            totalTrades: rows.length,
            uniqueTickers: Object.keys(tickers).length,
            startDate: sortedDates[0] || null,
            endDate: sortedDates[sortedDates.length - 1] || null,
            topTickers,
            assetTypes,
            tradesByYear: years
          };
        }
      }
    }

    return Response.json({
      slug,
      timeseries,
      summary,
      trades
    });
  } catch (err) {
    console.error("Portfolio API error:", err);
    return Response.json({
      slug: params.senatorSlug,
      timeseries: [],
      summary: null,
      trades: []
    });
  }
}
