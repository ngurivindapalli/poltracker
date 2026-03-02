export async function fetchLobbyingData(senatorName: string) {
  try {
    const key = process.env.LDA_API_KEY

    if (!key) {
      console.log("LDA_API_KEY not set")
      return []
    }

    const url =
      `https://lda.senate.gov/api/v1/filings/?client=${encodeURIComponent(senatorName)}&api_key=${key}`

    const res = await fetch(url)

    if (!res.ok) return []

    const data = await res.json()

    return data.results || []

  } catch (e) {
    console.log("LDA error", e)
    return []
  }
}
