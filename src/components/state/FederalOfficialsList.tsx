import { CongressMemberCard } from "@/components/congress/CongressMemberCard";
import { Badge } from "@/components/ui/Badge";
import { getSenatorSummaries } from "@/lib/senators/summaries";
import { getRepresentativeSummaries } from "@/lib/representatives/summaries";
import { STATE_CODE_TO_NAME } from "@/lib/localData/usCounties";
import FederalOfficialsListClient from "./FederalOfficialsListClient";

type FederalOfficialsListProps = {
  stateCode: string;
};

export default async function FederalOfficialsList({
  stateCode,
}: FederalOfficialsListProps) {
  const code = stateCode.toUpperCase();
  const fullName = (STATE_CODE_TO_NAME[code] || "").toUpperCase();

  const [{ senators }, { representatives }] = await Promise.all([
    getSenatorSummaries(),
    getRepresentativeSummaries(),
  ]);

  const stateSenators = senators.filter((s) => {
    const value = (s.state || "").toUpperCase();
    return value === code || (fullName && value === fullName);
  });
  const stateReps = representatives
    .filter((r) => {
      const value = (r.state || "").toUpperCase();
      return value === code || (fullName && value === fullName);
    })
    .sort((a, b) => {
      const distA = parseInt(String(a.district ?? "999"), 10) || 999;
      const distB = parseInt(String(b.district ?? "999"), 10) || 999;
      return distA - distB;
    });

  if (stateSenators.length === 0 && stateReps.length === 0) {
    return <FederalOfficialsListClient stateCode={code} />;
  }

  return (
    <div className="mt-2">
      {stateSenators.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">U.S. Senators</h3>
            <Badge variant="neutral" className="text-xs">
              {stateSenators.length} {stateSenators.length === 1 ? "Senator" : "Senators"}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stateSenators.map((s) => (
              <CongressMemberCard
                key={s.bioguideId}
                member={{
                  bioguideId: s.bioguideId,
                  name: s.name,
                  party: s.party,
                  state: s.state,
                  imageUrl: s.imageUrl,
                  chamber: "senate",
                  estimatedNetWorth: s.estimatedNetWorth,
                  tradeCount: s.tradeCount,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {stateReps.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">House Representatives</h3>
            <Badge variant="neutral" className="text-xs">
              {stateReps.length} {stateReps.length === 1 ? "Representative" : "Representatives"}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stateReps.map((r) => (
              <CongressMemberCard
                key={r.bioguideId}
                member={{
                  bioguideId: r.bioguideId,
                  name: r.name,
                  party: r.party,
                  state: r.state,
                  district: r.district,
                  imageUrl: r.imageUrl,
                  chamber: "house",
                  estimatedNetWorth: r.estimatedNetWorth,
                  tradeCount: r.tradeCount,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
