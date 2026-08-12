/** Denormalized row for /senators listing — never hydrates trade lines. */
export type SenatorSummaryRow = {
  bioguideId: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  party: string | null;
  state: string | null;
  imageUrl: string | null;
  chamber: "senate" | string;
  estimatedNetWorth: number | null;
  tradeCount: number | null;
  tradeVolume: number | null;
  latestTradeDate: string | null;
  latestFinancialUpdate: string | null;
  dataUpdatedAt: string;
};

export type SenatorsListPayload = {
  senators: SenatorSummaryRow[];
  dataUpdatedAt: string | null;
  source: "SenatorSummary";
  count: number;
};
