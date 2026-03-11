import { getBaseUrl } from '@/lib/getBaseUrl'

export async function fetchGermanMembers() {
  const base = getBaseUrl()
  const res = await fetch(`${base}/api/germany/members`)

  const data = await res.json()

  return data
}
