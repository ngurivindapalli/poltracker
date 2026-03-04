import { getBaseUrl } from '@/lib/baseUrl'

export async function fetchGermanMembers() {
  const base = getBaseUrl()
  const res = await fetch(`${base}/api/germany/members`)

  const data = await res.json()

  return data
}
