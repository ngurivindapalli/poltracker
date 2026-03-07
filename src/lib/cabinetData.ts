import fs from "fs"
import path from "path"

const dataPath = path.join(process.cwd(),"data","whitehouse_cabinet.json")

export function getCabinetMembers() {
  const raw = fs.readFileSync(dataPath,"utf8")
  return JSON.parse(raw)
}

export function getCabinetMemberById(id:string){
  const members = getCabinetMembers()
  return members.find((m:any)=>m.id===id)
}
