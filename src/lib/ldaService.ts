/**
 * Fetch raw LDA filings without any filtering.
 * Used by committee-based matching logic.
 */
export async function fetchLDAFilings() {
  const apiKey = process.env.LDA_API_KEY;

  if (!apiKey) {
    console.log("Missing LDA key");
    return [];
  }

  try {
    const res = await fetch(
      `https://lda.senate.gov/api/v1/filings/?page_size=200`,
      {
        headers: {
          Authorization: `Token ${apiKey}`
        },
        cache: "no-store"
      }
    );

    const data = await res.json();

    if (!data.results) {
      console.log("No LDA results");
      return [];
    }

    return data.results;

  } catch (e) {
    console.log("LDA fetch error", e);
    return [];
  }
}

/**
 * @deprecated Use fetchLDAFilings + committee-based matching instead
 */
export async function fetchLDALobbying(bioguideId: string, memberName?: string) {
  // This function is deprecated - use committee-based matching
  return fetchLDAFilings();
}
