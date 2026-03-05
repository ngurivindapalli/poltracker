const fs = require("fs")
const yaml = require("js-yaml")

// Try multiple sources for social media data
const LEGISLATORS_URL =
  "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.yaml"
const SOCIAL_URL =
  "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-social-media.yaml"

async function generate() {
  console.log("Downloading legislator dataset...")

  // Download legislators
  const legislatorsRes = await fetch(LEGISLATORS_URL)
  if (!legislatorsRes.ok) {
    throw new Error(`Failed to download legislators: ${legislatorsRes.status}`)
  }
  const legislators = yaml.load(await legislatorsRes.text())

  // Try to download social media data
  let socialData = null
  try {
    const socialRes = await fetch(SOCIAL_URL)
    if (socialRes.ok) {
      socialData = yaml.load(await socialRes.text())
      console.log(`Loaded social media data for ${socialData?.length || 0} members`)
    } else {
      console.log(`Social media file not found (${socialRes.status}), will use alternative method`)
    }
  } catch (e) {
    console.log("Social media file not available, using alternative method")
  }

  console.log(`Loaded ${legislators.length} legislators`)

  // Check first few members to see structure
  console.log("\nFirst member keys:", Object.keys(legislators[0]))
  console.log("\nFirst member full structure (first 1500 chars):")
  console.log(JSON.stringify(legislators[0], null, 2).substring(0, 1500))
  
  // Check if any member has social field
  const memberWithSocial = legislators.find(m => m.social)
  if (memberWithSocial) {
    console.log("\nMember with 'social' field:", JSON.stringify(memberWithSocial.social, null, 2))
  } else {
    console.log("\nNo members found with 'social' field")
  }

  const accounts = {}

  // Create a map of bioguideId -> social data if available
  const socialMap = {}
  if (socialData && Array.isArray(socialData)) {
    socialData.forEach(item => {
      if (item.id?.bioguide && item.social?.twitter) {
        socialMap[item.id.bioguide] = item.social.twitter
      }
    })
  }

  // Process legislators
  legislators.forEach(member => {
    const bioguideId = member.id?.bioguide

    if (!bioguideId) return

    // First check social media file
    let twitterHandle = socialMap[bioguideId]

    // If not found, check member object itself
    if (!twitterHandle) {
      if (member.social && member.social.twitter) {
        twitterHandle = member.social.twitter
      } else if (member.contact && member.contact.twitter) {
        twitterHandle = member.contact.twitter
      } else if (member.links && member.links.twitter) {
        twitterHandle = member.links.twitter
      } else if (member.twitter) {
        twitterHandle = member.twitter
      }
    }

    if (twitterHandle) {
      // Clean handle (remove @ if present, handle both string and object)
      let cleanHandle = null
      if (typeof twitterHandle === 'string') {
        cleanHandle = twitterHandle.replace(/^@/, '').trim()
      } else if (twitterHandle.handle) {
        cleanHandle = String(twitterHandle.handle).replace(/^@/, '').trim()
      } else if (twitterHandle.id) {
        cleanHandle = String(twitterHandle.id).replace(/^@/, '').trim()
      }

      if (cleanHandle && cleanHandle.length > 0) {
        accounts[bioguideId] = cleanHandle
      }
    }
  })

  console.log(`Found ${Object.keys(accounts).length} Twitter handles`)

  // Add world leaders
  accounts["WORLD_POTUS"] = "POTUS"
  accounts["WORLD_UK_PM"] = "RishiSunak"
  accounts["WORLD_GERMANY_CHANCELLOR"] = "Bundeskanzler"
  accounts["WORLD_INDIA_PM"] = "narendramodi"
  accounts["WORLD_FRANCE_PRESIDENT"] = "EmmanuelMacron"

  const output = `export const socialAccounts: Record<string, string> = ${JSON.stringify(accounts, null, 2)}
`

  // Ensure directory exists
  if (!fs.existsSync("src/data")) {
    fs.mkdirSync("src/data", { recursive: true })
  }

  fs.writeFileSync(
    "src/data/socialAccounts.ts",
    output
  )

  console.log(`Generated accounts: ${Object.keys(accounts).length}`)
  console.log(`  - Congress members: ${Object.keys(accounts).filter(k => !k.startsWith('WORLD_')).length}`)
  console.log(`  - World leaders: ${Object.keys(accounts).filter(k => k.startsWith('WORLD_')).length}`)
}

generate().catch(err => {
  console.error("Error:", err)
  process.exit(1)
})
