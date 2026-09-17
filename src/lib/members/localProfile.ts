import { getLocalMember } from "@/lib/congressData";
import { getSenatorSummary } from "@/lib/senators/summaries";
import { getRepresentativeSummary } from "@/lib/representatives/summaries";
import { senatorImageUrl } from "@/lib/images";

export async function getLocalMemberProfile(bioguideId: string) {
  const bid = bioguideId.toUpperCase();
  const local = getLocalMember(bid);
  const [sen, rep] = await Promise.all([
    getSenatorSummary(bid),
    getRepresentativeSummary(bid),
  ]);
  const summary = sen || rep;
  if (!local && !summary) return null;

  const name = summary?.name || local?.name || bid;
  return {
    member: local,
    profile: {
      bioguideId: bid,
      name,
      party: summary?.party || local?.party || null,
      state: summary?.state || local?.state || null,
      imageUrl: summary?.imageUrl || senatorImageUrl(bid, "450x550"),
    },
  };
}
