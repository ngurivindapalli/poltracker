import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { SourceAttribution } from "@/components/state/SourceAttribution";
import { getCountyDetail } from "@/lib/localData/directory";

export const revalidate = 600;

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

export default async function CountyLocalPage({
  params,
}: {
  params: { stateCode: string; county: string };
}) {
  const detail = await getCountyDetail(params.stateCode, params.county);
  if (!detail) notFound();

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

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Upcoming Elections</h2>
        {detail.elections.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Local election data is not currently available for this county.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {detail.elections.map((election) => (
              <li key={`${election.title}-${election.date}-${election.sourceName}`}>
                <Card className="p-4">
                  <p className="text-sm font-medium">{election.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(election.date)}
                    {election.office ? ` · ${election.office}` : ""}
                    {election.type ? ` · ${election.type}` : ""}
                  </p>
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

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Local events</h2>
        {detail.events.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No local events are stored for this county.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {detail.events.map((event) => (
              <li key={`${event.title}-${event.date}-${event.sourceName}`}>
                <Card className="p-4">
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(event.date)}
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
        )}
      </section>
    </main>
  );
}
