import fs from "fs"
import path from "path"

const dataPath = path.join(process.cwd(), "data", "poltracker_congress_dataset.json")

export function getCongressMembers() {
  const raw = fs.readFileSync(dataPath, "utf8")
  return JSON.parse(raw)
}

export function getSenators() {
  return getCongressMembers().filter((m:any)=>m.role==="Senator")
}

export function getRepresentatives() {
  return getCongressMembers().filter((m:any)=>m.role==="Representative")
}

export function getMemberByBioguide(id:string) {
  return getCongressMembers().find((m:any)=>m.bioguide_id===id)
}
