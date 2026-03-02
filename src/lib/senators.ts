import { fetchMember } from "@/lib/congress"

export async function getSenatorName(bioguideId: string): Promise<string> {
  try {
    const data = await fetchMember(bioguideId)
    const member = data?.member ?? data
    return member?.directOrderName ?? member?.name ?? member?.fullName ?? bioguideId
  } catch (e) {
    console.log("Could not fetch senator name, using bioguideId")
    return bioguideId
  }
}
