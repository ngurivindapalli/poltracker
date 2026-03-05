const fs = require("fs")
const Parser = require("rss-parser")

const parser = new Parser()

const NITTER_INSTANCES = [
  "https://nitter.poast.org",
  "https://nitter.privacydev.net",
  "https://nitter.1d4.us",
  "https://nitter.fdn.fr",
  "https://nitter.unixfox.eu",
  "https://nitter.net"
]

// Failover function to try multiple Nitter instances
async function fetchRSS(parser, handle) {
  for (const instance of NITTER_INSTANCES) {
    try {
      const url = `${instance}/${handle}/rss`
      const feed = await parser.parseURL(url)
      
      if (feed && feed.items && feed.items.length > 0) {
        return feed
      }
    } catch (err) {
      // Try next instance
      continue
    }
  }
  
  throw new Error("All Nitter instances failed")
}

// Import social accounts - parse TypeScript file
function loadSocialAccounts() {
  try {
    // Read the TypeScript file and extract the export
    const fileContent = fs.readFileSync("src/data/socialAccounts.ts", "utf8")
    // Match the object literal after the export (handle TypeScript type annotation)
    // Pattern: export const socialAccounts: Record<...> = { ... }
    // Match from opening brace to closing brace (handle nested objects)
    const match = fileContent.match(/export const socialAccounts[^=]*=\s*(\{[\s\S]*\});?\s*$/m)
    if (match) {
      // Clean up the match - remove comments and trailing whitespace
      let objStr = match[1]
        .replace(/\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .trim()
      
      // Evaluate the object (safe since it's our own file)
      const accounts = eval(`(${objStr})`)
      console.log(`Loaded ${Object.keys(accounts).length} social accounts`)
      return accounts
    }
    console.error("Could not parse socialAccounts.ts - no match found")
    console.error("File content preview:", fileContent.substring(0, 200))
    return {}
  } catch (e) {
    console.error("Error loading social accounts:", e)
    return {}
  }
}

async function run() {
  const accounts = loadSocialAccounts()
  const tweets = {}

  console.log(`Fetching tweets for ${Object.keys(accounts).length} accounts...`)

  for (const [bioguideId, handle] of Object.entries(accounts)) {
    try {
      const feed = await fetchRSS(parser, handle)

      tweets[bioguideId] = feed.items.slice(0, 5).map(t => ({
        text: t.title || t.contentSnippet || "",
        link: t.link || "",
        date: t.pubDate || ""
      }))

      console.log(`✓ ${handle}`)
    } catch (err) {
      tweets[bioguideId] = []
      console.log(`✗ Failed ${handle}`)
    }
  }

  // Ensure data directory exists
  if (!fs.existsSync("src/data")) {
    fs.mkdirSync("src/data", { recursive: true })
  }

  fs.writeFileSync(
    "src/data/tweets.json",
    JSON.stringify(tweets, null, 2)
  )

  console.log(`\nTweet dataset updated. Total accounts: ${Object.keys(tweets).length}`)
}

run().catch(err => {
  console.error("Error:", err)
  process.exit(1)
})
