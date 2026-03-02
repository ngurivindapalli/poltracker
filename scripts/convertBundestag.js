const fs = require("fs")
const xml2js = require("xml2js")

const path = require("path")
const xmlPath = path.join(__dirname, "MDB_STAMMDATEN.XML")
const xml =
  fs.readFileSync(xmlPath, "utf8")

xml2js.parseString(xml, (err, result) => {
  if (err) {
    console.error("XML parse error:", err)
    return
  }

  // Actual structure: DOCUMENT.MDB (array)
  const mdbArray = result.DOCUMENT?.MDB || []
  
  console.log("Found", mdbArray.length, "MDB entries")

  const members = mdbArray.map(m => {
    // Get the first name entry
    const nameEntry = m.NAMEN?.[0]?.NAME?.[0] || {}
    const id = m.ID?.[0] || Math.random().toString()

    return {
      id: id,
      name: (nameEntry.VORNAME?.[0] || "") + " " + (nameEntry.NACHNAME?.[0] || "")
    }
  }).filter(m => m.name.trim() !== "")

  const outputPath = path.join(__dirname, "..", "data", "bundestag.json")
  const dataDir = path.join(__dirname, "..", "data")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  fs.writeFileSync(
    outputPath,
    JSON.stringify(members, null, 2)
  )

  console.log("Converted", members.length, "members")
})
