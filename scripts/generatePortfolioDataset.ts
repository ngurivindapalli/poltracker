import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const OUTPUT_PATH = path.join(process.cwd(), "data", "portfolio.csv");

async function generate() {
  console.log("Fetching senators...");

  const res = await fetch("http://localhost:3000/api/senators");
  const data = await res.json();
  const senators = data.senators || [];

  if (!Array.isArray(senators)) {
    throw new Error("Failed to fetch senators list");
  }

  console.log(`Generating portfolio data for ${senators.length} senators`);

  const years = [2021, 2022, 2023, 2024];

  let csv =
    "bioguideId,senator,state,asset_category,estimated_min,estimated_max,report_year\n";

  senators.forEach((s: any) => {
    const categories = [
      "Stocks",
      "Mutual Funds",
      "Bonds",
      "Real Estate",
      "Private Equity",
    ];

    years.forEach((year, i) => {
      const base = 500000 + Math.floor(Math.random() * 2000000);

      categories.forEach((cat) => {
        const min = Math.floor(base * (0.1 + Math.random() * 0.2));
        const max = min + Math.floor(Math.random() * 200000);

        csv += `${s.bioguideId},${s.name},${s.state},${cat},${min},${max},${year}\n`;
      });
    });
  });

  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, csv);

  console.log("Portfolio dataset generated at:");
  console.log(OUTPUT_PATH);
}

generate();
