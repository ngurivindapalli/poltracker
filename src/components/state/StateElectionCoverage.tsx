import { getStateLevelCoverage } from "@/lib/localElections/electionCoverage";

function statusLabel(status: string) {
  if (status === "COMPLETE") return "Complete";
  if (status === "PARTIAL") return "Partial";
  if (status === "LIMITED") return "Limited";
  return "Not currently available";
}

export async function StateElectionCoverage({ stateCode }: { stateCode: string }) {
  const coverage = await getStateLevelCoverage(stateCode);
  const rows = [
    { label: "Federal", ...coverage.federal },
    { label: "Statewide", ...coverage.statewide },
    { label: "State Legislature", ...coverage.legislature },
    { label: "Ballot Measures", ...coverage.ballotMeasures },
    { label: "County", ...coverage.county },
  ];

  return (
    <section className="mb-12">
      <h2 className="text-lg font-semibold">State Election Coverage</h2>
      {coverage.authorityName ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Official authority: {coverage.authorityUrl ? (
            <a href={coverage.authorityUrl} className="underline underline-offset-2" target="_blank" rel="noreferrer">
              {coverage.authorityName}
            </a>
          ) : coverage.authorityName}
          {coverage.authorityStatus ? ` · ${coverage.authorityStatus.replace(/_/g, " ").toLowerCase()}` : ""}
        </p>
      ) : null}
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.label} className="border border-border rounded-md p-4">
            <p className="text-sm font-medium">
              {row.label}
              <span className="ml-2 text-xs font-normal text-muted-foreground">{statusLabel(row.status)}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{row.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
