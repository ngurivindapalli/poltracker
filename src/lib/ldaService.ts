export async function fetchLDALobbying(bioguideId: string) {
  const apiKey = process.env.LDA_API_KEY

  if (!apiKey) {
    console.log("Missing LDA key")
    return []
  }

  try {
    const res = await fetch(
      `https://lda.senate.gov/api/v1/filings/?senator=${bioguideId}&page_size=20`,
      {
        headers: {
          Authorization: `Token ${apiKey}`
        },
        cache: "no-store"
      }
    )

    const data = await res.json()

    if (!data.results) {
      console.log("No LDA results")
      return []
    }

    return data.results.map((f: any, i: number) => ({
      id: `client-${i}`,
      name:
        f.client?.name ||
        f.registrant?.name ||
        "Unknown Client",
      issue:
        f.general_issue_code_display ||
        "Lobbying",
      amount:
        f.income || 0
    }))

  } catch (e) {
    console.log("LDA error", e)
    return []
  }
}
