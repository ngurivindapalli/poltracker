import fs from "fs";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
  console.error("ERROR: OPENAI_API_KEY not found in .env.local");
  process.exit(1);
}

interface Senator {
  bioguideId: string;
  name: string;
  startYear?: number;
}

interface PortfolioPoint {
  year: number;
  value: number;
}

async function fetchSenators(): Promise<{ senators: Senator[] }> {
  const res = await fetch("http://localhost:3000/api/senators");
  return await res.json();
}

async function generateHistory(senator: Senator): Promise<PortfolioPoint[]> {
  const prompt = `
Generate estimated yearly investment portfolio values
for US Senator ${senator.name}.

Use publicly available information such as:

- financial disclosures
- stock trades
- net worth estimates

Return JSON:

[
 { "year": YEAR, "value": NUMBER }
]

Requirements:

- Start at year entered office: ${senator.startYear || 2010}
- End 2024
- Realistic growth
- At least 5 points
- Numbers in USD

Only JSON, no explanation.
`;

  const res = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    }
  );

  const json = await res.json();
  
  // Debug: log the response if there's an error
  if (!json.choices || !json.choices[0]) {
    console.log("API Error:", JSON.stringify(json, null, 2));
    throw new Error("Invalid API response");
  }
  
  // Extract JSON from response
  let content = json.choices[0].message.content;
  
  // Clean up markdown code blocks if present
  if (content.includes("```")) {
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  }
  
  return JSON.parse(content.trim());
}

async function main() {
  console.log("Fetching senators...");
  
  const senatorsData = await fetchSenators();
  const senators = senatorsData.senators;

  console.log(`Found ${senators.length} senators`);

  const dataset: Record<string, PortfolioPoint[]> = {};

  for (const s of senators) {
    console.log("Generating:", s.name);

    try {
      dataset[s.bioguideId] = await generateHistory(s);
      
      // Rate limiting - wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (e) {
      console.log("Failed:", s.name, e);
    }
  }

  fs.writeFileSync(
    "data/portfolio-history.json",
    JSON.stringify(dataset, null, 2)
  );

  console.log("DONE - Generated data for", Object.keys(dataset).length, "senators");
}

main();
