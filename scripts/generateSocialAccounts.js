import fs from "fs"
import path from "path"

const dataPath = path.join(process.cwd(),"data","poltracker_congress_dataset.json")

const members = JSON.parse(fs.readFileSync(dataPath,"utf8"))

const socialAccounts = {}

members.forEach(member=>{
  if(member.twitter){
    socialAccounts[member.name] = {
      twitter: member.twitter,
      facebook: member.facebook,
      youtube: member.youtube,
      instagram: member.instagram
    }
  }
})

const outputPath = path.join(process.cwd(),"data","socialAccounts.json")

fs.writeFileSync(outputPath, JSON.stringify(socialAccounts,null,2))

console.log("Generated social accounts for",Object.keys(socialAccounts).length,"members")
