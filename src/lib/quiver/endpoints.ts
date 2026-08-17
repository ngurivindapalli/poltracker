/**
 * Official Quiver Quantitative Hobbyist endpoints used by Politeia.
 * Base: https://api.quiverquant.com/beta  (override with QUIVER_BASE_URL)
 *
 * Trump stock trades endpoint was verified against the live API as:
 *   GET /beta/bulk/trumpstocktrades
 */

export const QUIVER_ENDPOINTS = {
  // 1. Congress trading
  liveCongressTrading: "/live/congresstrading",
  bulkCongressTrading: "/bulk/congresstrading",
  historicalCongressTrading: (ticker: string) =>
    `/historical/congresstrading/${encodeURIComponent(ticker)}`,

  // 2. Politician net worth / profiles
  bulkPoliticians: "/bulk/congress/politicians",

  // 3. Corporate donors
  bulkCorporateDonors: "/bulk/corporatedonors",
  historicalCorporateDonors: (ticker: string) =>
    `/historical/corporatedonors/${encodeURIComponent(ticker)}`,

  // 4. Government contracts
  liveGovContractsAll: "/live/govcontractsall",
  historicalGovContractsAll: (ticker: string) =>
    `/historical/govcontractsall/${encodeURIComponent(ticker)}`,
  liveGovContractsQuarterly: "/live/govcontracts",

  // 5. Corporate lobbying
  liveLobbying: "/live/lobbying",
  historicalLobbying: (ticker: string) =>
    `/historical/lobbying/${encodeURIComponent(ticker)}`,

  // 6. Off-exchange
  liveOffExchange: "/live/offexchange",
  historicalOffExchange: (ticker: string) =>
    `/historical/offexchange/${encodeURIComponent(ticker)}`,

  // 7. Donald Trump stock trades (verified live 2026-08-11)
  bulkTrumpStockTrades: "/bulk/trumpstocktrades",

  // 8. Congress stock holdings (verified live 2026-08-17)
  liveCongressHoldings: "/live/congressholdings",
} as const;

export type QuiverDatasetKey =
  | "congress_trades"
  | "politician_net_worth"
  | "corporate_donors"
  | "government_contracts"
  | "corporate_lobbying"
  | "off_exchange"
  | "trump_trades"
  | "congress_holdings";
