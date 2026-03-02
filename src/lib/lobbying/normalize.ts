export function normalizeArray(data: any) {
  if (!data) return []

  if (Array.isArray(data)) return data

  if (Array.isArray(data.data)) return data.data

  if (Array.isArray(data.results)) return data.results

  if (Array.isArray(data.donors)) return data.donors

  if (Array.isArray(data.investments)) return data.investments

  if (Array.isArray(data.affiliations)) return data.affiliations

  return []
}
