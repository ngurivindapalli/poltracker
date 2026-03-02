import membersData from '../../data/bundestag-cache.json'

export function getGermanyMember(id: string) {
  return membersData.find((m: any) => m.id === id)
}

export function getAllGermanyMembers() {
  return membersData
}
