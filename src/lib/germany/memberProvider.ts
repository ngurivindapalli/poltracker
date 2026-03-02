import { getServerUrl } from '@/lib/serverUrl'

export async function fetchGermanMembers() {
  const base = getServerUrl()
  const res = await fetch(`${base}/api/germany/members`)

  const data = await res.json()

  return data
}
