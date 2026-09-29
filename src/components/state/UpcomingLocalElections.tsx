import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SourceAttribution } from "@/components/state/SourceAttribution";
import { getUpcomingLocalElections } from "@/lib/localElections/upcoming";

function categoryLabel(category: string | null, statewide: boolean) {
  if (category === "MUNICIPAL" || category === "TOWN" || category === "TOWNSHIP") return "Municipal Election";
  if (category === "COUNTY") return "County Election";
  if (category === "SCHOOL") return "School Election";
  if (statewide || category === "FEDERAL" || category === "STATE") return "State / Federal Election";
  if (category === "JUDICIAL") return "Judicial Election";
  if (category === "BALLOT_MEASURE") return "Ballot Measure";
  return null;
}

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";
  const d = new Date(value.includes("T") ? value : `${value}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function UpcomingLocalElections({
  stateCode,
  limit = 8,
}: {
  stateCode: string;
  limit?: number;
}) {
  const elections = await getUpcomingLocalElections({
    state: stateCode,
    limit: Math.max(limit, 60),
  });
  const dateGroups = new Map<string, Map<string, typeof elections>>();
  for (const election of elections) {
    const typeKey = election.electionType || categoryLabel(election.electionCategory, election.statewide) || "Election";
    const types = dateGroups.get(election.date) || new Map();
    const list = types.get(typeKey) || [];
    list.push(election);
    types.set(typeKey, list);
    dateGroups.set(election.date, types);
  }

  return (
    <section className="mb-12">
      <h2 className="text-lg font-semibold">Upcoming Local Elections</h2>
      {!elections.length ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Verified contest data is not currently available.
        </p>
      ) : (
        <ul className="mt-4 space-y-6">
          {[...dateGroups.entries()].map(([date, types]) => (
            <li key={date}>
              <p className="text-xs text-muted-foreground">{formatDate(date)}</p>
              <ul className="mt-2 space-y-4">
                {[...types.entries()].map(([electionType, rows]) => {
                  const contests = rows.filter(
                    (row) => row.recordKind === "CONTEST" || row.recordKind === "MEASURE"
                  );
                  const visible = contests.length ? contests : rows;
                  return (
                    <li key={`${date}-${electionType}`}>
                      <p className="text-sm font-medium">{electionType}</p>
                      {!contests.length ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Verified contest data is not currently available.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-3">
                          {visible.map((election) => (
                            <li
                              key={`${election.href}-${election.title}-${election.date}-${election.recordKind}`}
                            >
                              <Link href={election.href} className="block">
                                <Card className="p-4 hover:border-foreground/20">
                                  <p className="mt-1 text-sm font-medium">{election.title}</p>
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    {election.candidates.length ? (
                                      <ul className="space-y-1">
                                        {election.candidates.slice(0, 12).map((candidate) => (
                                          <li key={`${candidate.candidateId || candidate.name}`}>
                                            {candidate.name}
                                            {candidate.party ? ` · ${candidate.party}` : ""}
                                            {candidate.status ? ` · ${candidate.status}` : ""}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p>
                                        Candidate information is not currently available from the
                                        verified source.
                                      </p>
                                    )}
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {categoryLabel(election.electionCategory, election.statewide)
                                      ? `${categoryLabel(election.electionCategory, election.statewide)} · `
                                      : ""}
                                    {election.jurisdictionName ||
                                      (election.statewide ? election.stateCode : election.countyName)}
                                    {election.office ? ` · ${election.office}` : ""}
                                  </p>
                                  <SourceAttribution
                                    sourceName={election.sourceName}
                                    sourceUrl={election.sourceUrl}
                                    lastVerified={election.lastVerified}
                                  />
                                </Card>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
