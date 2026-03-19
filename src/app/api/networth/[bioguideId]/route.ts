import { calculateNetWorthFromHoldings, parseRange } from "@/lib/networth";
import { getHoldingsForPolitician } from "@/lib/holdingsProvider";
import { getTradesForPolitician } from "@/lib/congressNetWorth";

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const { bioguideId } = params;

  const holdings = getHoldingsForPolitician(bioguideId);
  const trades = getTradesForPolitician(bioguideId);

  let netWorth = 0;
  if (holdings && holdings.length > 0) {
    netWorth = calculateNetWorthFromHoldings(holdings);
  }
  if (netWorth === 0 && trades?.length > 0) {
    netWorth = Math.round(
      trades.reduce((sum: number, t: any) => sum + parseRange(t.amount), 0) * 0.1
    );
  }

  return Response.json({
    totalNetWorth: netWorth,
    numberOfTrades: trades?.length || 0,
  });
}
