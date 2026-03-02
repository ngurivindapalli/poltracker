export async function getWikidataIdFromBioguide(bioguideId: string) {
  const res = await fetch(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${bioguideId}&language=en&format=json&origin=*`
  );

  const data = await res.json();

  if (!data.search?.length) return null;

  return data.search[0].id;
}

export async function getSenatorSpouseNGOs(wikidataId: string) {
  const query = `
    SELECT ?spouseLabel ?orgLabel ?relationship WHERE {
      wd:${wikidataId} wdt:P26 ?spouse.

      {
        ?spouse wdt:P108 ?org.
        BIND("Employer" as ?relationship)
      }

      UNION

      {
        ?spouse wdt:P1416 ?org.
        BIND("Affiliation" as ?relationship)
      }

      UNION

      {
        ?spouse wdt:P463 ?org.
        BIND("Member" as ?relationship)
      }

      ?org wdt:P31/wdt:P279* wd:Q163740.

      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en".
      }

    }
  `;

  const res = await fetch(
    "https://query.wikidata.org/sparql",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/sparql-query"
      },
      body: query
    }
  );

  const data = await res.json();

  return data.results?.bindings?.map((r: any) => ({
    spouse: r.spouseLabel?.value,
    organization: r.orgLabel?.value,
    relationship: r.relationship?.value
  })) || [];
}
