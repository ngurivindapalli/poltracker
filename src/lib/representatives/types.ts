export type RepresentativeSummaryRow = {
  bioguideId: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  party: string | null;
  state: string | null;
  district: string | null;
  imageUrl: string | null;
  chamber: "house" | string;
  estimatedNetWorth: number | null;
  tradeCount: number | null;
  tradeVolume: number | null;
  latestTradeDate: string | null;
  latestFinancialUpdate: string | null;
  dataUpdatedAt: string;
};

export type RepresentativesListPayload = {
  representatives: RepresentativeSummaryRow[];
  dataUpdatedAt: string | null;
  source: "RepresentativeSummary";
  count: number;
};
