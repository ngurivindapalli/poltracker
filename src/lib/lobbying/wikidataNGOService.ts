export async function fetchNGOData(senatorName: string) {
  try {
    const query = `
      SELECT ?orgLabel WHERE {
        ?person rdfs:label "${senatorName}"@en .
        ?person wdt:P463 ?org .
        ?org wdt:P31 wd:Q163740 .
        SERVICE wikibase:label {
          bd:serviceParam wikibase:language "en"
        }
      }
    `

    const url = "https://query.wikidata.org/sparql"

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/sparql-query",
        "Accept": "application/json",
        "User-Agent": "PolTracker/1.0"
      },
      body: query
    })

    if (!res.ok) return []

    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.log("NGO: Non-JSON response from Wikidata")
      return []
    }

    return data.results?.bindings?.map((x: any) => x.orgLabel?.value || "") || []

  } catch (e) {
    console.log("NGO error", e)
    return []
  }
}
