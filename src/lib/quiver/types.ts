/**
 * Raw + normalized types for Quiver Hobbyist datasets.
 */

export type QuiverLiveCongressTrade = {
  Representative?: string;
  BioGuideID?: string | null;
  ReportDate?: string | null;
  TransactionDate?: string | null;
  Ticker?: string | null;
  Transaction?: string | null;
  Range?: string | null;
  House?: string | null;
  Amount?: string | number | null;
  Party?: string | null;
  last_modified?: string | null;
  TickerType?: string | null;
  Description?: string | null;
  ExcessReturn?: number | null;
  PriceChange?: number | null;
  SPYChange?: number | null;
};

export type QuiverBulkCongressTrade = {
  Ticker?: string | null;
  TickerType?: string | null;
  Company?: string | null;
  Traded?: string | null;
  Transaction?: string | null;
  Trade_Size_USD?: string | number | null;
  Status?: string | null;
  Subholding?: string | null;
  Description?: string | null;
  Name?: string | null;
  BioGuideID?: string | null;
  Filed?: string | null;
  Party?: string | null;
  District?: string | null;
  Chamber?: string | null;
  Comments?: string | null;
  Quiver_Upload_Time?: string | null;
  excess_return?: string | number | null;
  State?: string | null;
  last_modified?: string | null;
};

export type QuiverPolitician = {
  BioGuideID?: string | null;
  CandidateID?: string | null;
  Name?: string | null;
  Party?: string | null;
  Chamber?: string | null;
  State?: string | null;
  ImageURL?: string | null;
  TradeCount?: number | null;
  TradeVolume?: number | null;
  NetWorth?: number | null;
};

export type QuiverCorporateDonor = {
  BioGuideID?: string | null;
  CandidateName?: string | null;
  CompanyCMTENM?: string | null;
  TransactionDate?: string | null;
  TransactionAmount?: number | null;
  Ticker?: string | null;
  CommitteeName?: string | null;
  Cycle?: number | null;
  TransactionType?: string | null;
  CompanyCMTEID?: string | null;
  Uploaded?: string | null;
};

export type QuiverGovContract = {
  Ticker?: string | null;
  Date?: string | null;
  Description?: string | null;
  Agency?: string | null;
  Amount?: number | string | null;
  action_date?: string | null;
};

export type QuiverLobbying = {
  Date?: string | null;
  Amount?: string | number | null;
  Client?: string | null;
  Issue?: string | null;
  Specific_Issue?: string | null;
  Registrant?: string | null;
  Ticker?: string | null;
};

export type QuiverOffExchange = {
  Ticker?: string | null;
  Date?: string | null;
  OTC_Short?: number | null;
  OTC_Total?: number | null;
  DPI?: number | null;
};

/** Confirmed shape of GET /beta/bulk/trumpstocktrades */
export type QuiverTrumpTrade = {
  Ticker?: string | null;
  Company?: string | null;
  Transaction?: string | null;
  Amount?: string | null;
  Filed?: string | null;
  Traded?: string | null;
  ExcessReturn?: number | null;
};

export type NormalizedCongressTrade = {
  sourceHash: string;
  bioguideId: string | null;
  politicianName: string;
  chamber: string | null;
  party: string | null;
  ticker: string | null;
  companyName: string | null;
  transaction: string;
  transactionDate: string | null;
  reportDate: string | null;
  amount: string | null;
  amountRange: string | null;
  tickerType: string | null;
  excessReturn: number | null;
  priceChange: number | null;
  spyChange: number | null;
  description: string | null;
  owner: string | null;
  district: string | null;
  state: string | null;
  source: "quiver";
  fetchedAt: string;
};

export type NormalizedNetWorth = {
  bioguideId: string;
  name: string;
  party: string | null;
  chamber: string | null;
  state: string | null;
  imageUrl: string | null;
  tradeCount: number | null;
  tradeVolume: number | null;
  netWorth: number | null;
  source: "quiver";
  fetchedAt: string;
};

export type NormalizedDonor = {
  sourceHash: string;
  bioguideId: string | null;
  candidateName: string;
  companyCommitteeName: string | null;
  transactionDate: string | null;
  transactionAmount: number | null;
  ticker: string | null;
  committeeName: string | null;
  cycle: number | null;
  transactionType: string | null;
  companyCommitteeId: string | null;
  source: "quiver";
  fetchedAt: string;
};

export type NormalizedContract = {
  sourceHash: string;
  ticker: string;
  vendor: string | null;
  agency: string | null;
  awardDate: string | null;
  actionDate: string | null;
  description: string | null;
  amount: number | null;
  status: string | null;
  source: "quiver";
  fetchedAt: string;
};

export type NormalizedLobbying = {
  sourceHash: string;
  ticker: string | null;
  date: string | null;
  amount: number | null;
  client: string | null;
  issue: string | null;
  specificIssue: string | null;
  registrant: string | null;
  source: "quiver";
  fetchedAt: string;
};

export type NormalizedOffExchange = {
  sourceHash: string;
  ticker: string;
  date: string | null;
  otcShort: number | null;
  otcTotal: number | null;
  dpi: number | null;
  source: "quiver";
  fetchedAt: string;
};

export type NormalizedTrumpTrade = {
  sourceHash: string;
  ticker: string | null;
  company: string | null;
  transaction: string | null;
  transactionDate: string | null;
  reportDate: string | null;
  amount: string | null;
  amountRange: string | null;
  excessReturn: number | null;
  source: "quiver";
  fetchedAt: string;
};

export type SyncResult = {
  dataset: string;
  status: "success" | "failed" | "partial" | "skipped";
  recordsFetched: number;
  recordsWritten: number;
  recordsSkipped: number;
  errors: string[];
  startedAt: string;
  completedAt: string;
  pagesFetched?: number;
  coverageStart?: string | null;
  coverageEnd?: string | null;
  recordsMatched?: number;
  recordsUnmatched?: number;
  recordsInserted?: number;
  recordsUpdated?: number;
};

export type DatasetMeta = {
  lastUpdated: string | null;
  recordCount: number;
  status: string;
  pagesFetched?: number;
  rawFetched?: number;
  coverageStart?: string | null;
  coverageEnd?: string | null;
  recordsMatched?: number;
  recordsUnmatched?: number;
  recordsInserted?: number;
  recordsUpdated?: number;
  message?: string;
};

export type QuiverMeta = {
  source: "Quiver Quantitative";
  datasets: Record<string, DatasetMeta>;
};
