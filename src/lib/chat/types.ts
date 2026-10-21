export type ChatRole = "user" | "assistant";

export type ChatHistoryMessage = {
  role: ChatRole;
  content: string;
};

export type ChatSourceType =
  | "bill"
  | "profile"
  | "news"
  | "financial"
  | "contract";

export type ChatSource = {
  type: ChatSourceType;
  title: string;
  url?: string;
  date?: string | null;
};

export type ChatRequestBody = {
  message: string;
  bioguideId?: string;
  state?: string;
  history?: ChatHistoryMessage[];
};

export type ChatErrorCode =
  | "unconfigured"
  | "invalid"
  | "rate_limited"
  | "unavailable"
  | "quota"
  | "retrieval";

export type ChatResponseBody = {
  answer: string;
  sources?: ChatSource[];
  unverified?: boolean;
  error?: ChatErrorCode;
  retryable?: boolean;
};

export type ChatIntent = {
  bills: boolean;
  contracts: boolean;
  news: boolean;
  financial: boolean;
  trades: boolean;
  netWorth: boolean;
  general: boolean;
  injection: boolean;
  mySenator: boolean;
  requiresRecords: boolean;
};

export type ChatMember = {
  bioguideId: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  party: string | null;
  state: string | null;
  district: string | null;
  chamber: "senate" | "house" | string;
  estimatedNetWorth: number | null;
  tradeCount: number | null;
  tradeVolume: number | null;
  latestTradeDate: string | null;
  financialUpdated: string | null;
  dataUpdatedAt: string | null;
  profilePath: string;
};

export type ChatBillRecord = {
  id: string;
  title: string;
  role?: string;
  latestAction: string | null;
  url: string | null;
  congress?: number | null;
  fetchedAt?: string | null;
};

export type ChatNewsRecord = {
  title: string;
  url: string;
  source: string | null;
  publishedAt: string | null;
};

export type ChatTradeRecord = {
  politicianName?: string | null;
  bioguideId?: string | null;
  chamber?: string | null;
  ticker: string | null;
  company?: string | null;
  transaction: string;
  amount: string | null;
  tradeDate: string | null;
  filingDate: string | null;
  source?: string | null;
};

export type ChatContractRecord = {
  ticker: string;
  vendor: string;
  agency: string | null;
  awardDate: string | null;
  amount: number | null;
  description: string | null;
};

export type RetrievalCoverage = "records" | "partial" | "none";

export type RetrievalStatus =
  | "ok"
  | "empty"
  | "not_found"
  | "query_error"
  | "none";

export type RetrievalBundle = {
  intent: ChatIntent;
  members: ChatMember[];
  bills: ChatBillRecord[];
  news: ChatNewsRecord[];
  trades: ChatTradeRecord[];
  contracts: ChatContractRecord[];
  notes: string[];
  sources: ChatSource[];
  coverage: RetrievalCoverage;
  freshness: Record<string, string | null>;
  retrievalStatus: RetrievalStatus;
  queryError?: string | null;
};
