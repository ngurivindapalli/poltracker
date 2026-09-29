import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { SourceAttribution } from "@/components/state/SourceAttribution";
import { getCountyDetail } from "@/lib/localData/directory";
import { FEC_SOURCE_NAME } from "@/lib/localElections/types";
import { isOfficialCountySource } from "@/lib/localElections/electionCoverage";

export const revalidate = 600;

type CountyElection = Awaited<ReturnType<typeof getCountyDetail>> extends infer T
  ? T extends { elections: infer E }
    ? E extends Array<infer R>
      ? R
      : never
    : never
  : never;

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isUpcoming(date: string | null) {
  if (!date) return true;
  const t = Date.parse(date);
  if (!Number.isFinite(t)) return true;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return t >= start.getTime();
}

function isStatewideElection(election: {
  category: string | null;
  sourceName: string | null;
}) {
  return (
    election.sourceName === FEC_SOURCE_NAME ||
    election.category === "FEDERAL" ||
    election.category === "STATE"
  );
}

function ElectionGroup({
  title,
  elections,
  emptyText,
}: {
  title: string;
  elections: CountyElection[];
  emptyText?: string;
}) {
  if (!elections.length && !emptyText) return null;
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      {elections.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {elections.map((election) => (
            <li key={`${election.title}-${election.date}-${election.sourceName}`}>
              <Card className="p-4">
                <p className="text-sm font-medium">{election.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(election.date)}
                  {election.jurisdictionName ? ` · ${election.jurisdictionName}` : ""}
                  {election.office ? ` · ${election.office}` : ""}
                  {election.type ? ` · ${election.type}` : ""}
                  {election.subtype ? ` · ${election.subtype}` : ""}
                  {election.category ? ` · ${election.category}` : ""}
                </p>
                {election.recordKind === "CONTEST" || election.recordKind === "MEASURE" ? (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {election.candidates?.length ? (
                      <ul className="space-y-1">
                        {election.candidates.map((candidate) => (
                          <li key={`${candidate.candidateId || candidate.name}`}>
                            {candidate.name}
                            {candidate.party ? ` · ${candidate.party}` : ""}
                            {candidate.status ? ` · ${candidate.status}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Candidate information is not currently available from the verified source.</p>
                    )}
                  </div>
                ) : null}
                {election.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{election.description}</p>
                ) : null}
                <SourceAttribution
                  sourceName={election.sourceName}
                  sourceUrl={election.sourceUrl}
                  lastVerified={election.lastVerified}
                />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function CountyLocalPage({
  params,
}: {
  params: { stateCode: string; county: string };
}) {
  const detail = await getCountyDetail(params.stateCode, params.county);
  if (!detail) notFound();
  const upcomingElections = detail.elections.filter((election) => isUpcoming(election.date));
  const countyElections = upcomingElections.filter((e) => e.category === "COUNTY");
  const hasOfficialCountyCalendar = detail.events.some((e) => isOfficialCountySource(e.sourceName));

  return (
    <main className="mx-auto max-w-[900px] px-6 py-12">
      <Link
        href={`/state/${detail.stateCode}/local`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {detail.stateName}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{detail.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{detail.stateName}</p>
      <SourceAttribution
        sourceName={detail.sourceName}
        sourceUrl={detail.sourceUrl}
        lastVerified={detail.lastUpdated}
      />

      <ElectionGroup
        title="Federal / statewide"
        elections={upcomingElections.filter((e) => isStatewideElection(e))}
      />
      <ElectionGroup
        title="County Election Information"
        elections={countyElections}
        emptyText="Verified contest data is not currently available."
      />
      {hasOfficialCountyCalendar ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Dated county-board calendar events are listed below. Missing contest records are not proof that no county election exists.
        </p>
      ) : null}
      <ElectionGroup
        title="Judicial"
        elections={upcomingElections.filter((e) => e.category === "JUDICIAL")}
      />
      <ElectionGroup
        title="Ballot measure"
        elections={upcomingElections.filter((e) => e.category === "BALLOT_MEASURE")}
      />

      {detail.events.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Election Calendar</h2>
          <ul className="mt-3 space-y-3">
            {detail.events.map((event) => (
              <li key={`${event.title}-${event.date}-${event.sourceName}`}>
                <Card className="p-4">
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(event.date)}
                    {event.endDate ? ` – ${formatDate(event.endDate)}` : ""}
                    {event.eventType ? ` · ${event.eventType.replace(/_/g, " ").toLowerCase()}` : ""}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                  {event.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                  ) : null}
                  <SourceAttribution
                    sourceName={event.sourceName}
                    sourceUrl={event.sourceUrl}
                    lastVerified={event.lastVerified}
                  />
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
