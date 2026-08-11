/**
 * Normalization + deterministic hashing for Quiver payloads.
 */

import { createHash } from "crypto";
import type {
  NormalizedCongressTrade,
  NormalizedContract,
  NormalizedDonor,
  NormalizedLobbying,
  NormalizedNetWorth,
  NormalizedOffExchange,
  NormalizedTrumpTrade,
  QuiverBulkCongressTrade,
  QuiverCorporateDonor,
  QuiverGovContract,
  QuiverLiveCongressTrade,
  QuiverLobbying,
  QuiverOffExchange,
  QuiverPolitician,
  QuiverTrumpTrade,
} from "./types";

export function sha256(...parts: Array<string | number | null | undefined>): string {
  const raw = parts.map((p) => (p == null ? "" : String(p).trim().toLowerCase())).join("|");
  return createHash("sha256").update(raw).digest("hex");
}

export function cleanStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "nan") return null;
  return s;
}

export function cleanIsoDate(v: unknown): string | null {
  const s = cleanStr(v);
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function cleanNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function normalizeBio(v: unknown): string | null {
  const s = cleanStr(v);
  return s ? s.toUpperCase() : null;
}

export function normalizeNameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buySellSide(tx: string | null | undefined): "buy" | "sell" | "exchange" | "unknown" {
  const t = (tx || "").toLowerCase();
  if (t.includes("purchase") || t.includes("buy")) return "buy";
  if (t.includes("sale") || t.includes("sell")) return "sell";
  if (t.includes("exchange")) return "exchange";
  return "unknown";
}

export function normalizeLiveCongressTrade(
  row: QuiverLiveCongressTrade,
  fetchedAt: string
): NormalizedCongressTrade | null {
  const politicianName = cleanStr(row.Representative);
  const transaction = cleanStr(row.Transaction);
  if (!politicianName || !transaction) return null;

  const bioguideId = normalizeBio(row.BioGuideID);
  const ticker = cleanStr(row.Ticker)?.toUpperCase() ?? null;
  const transactionDate = cleanIsoDate(row.TransactionDate);
  const reportDate = cleanIsoDate(row.ReportDate);
  const amountRange = cleanStr(row.Range);
  const amount = row.Amount != null ? String(row.Amount) : null;

  return {
    sourceHash: sha256(
      bioguideId,
      politicianName,
      ticker,
      transaction,
      transactionDate,
      reportDate,
      amountRange,
      amount,
      cleanStr(row.Description)
    ),
    bioguideId,
    politicianName,
    chamber: cleanStr(row.House),
    party: cleanStr(row.Party),
    ticker,
    companyName: null,
    transaction,
    transactionDate,
    reportDate,
    amount,
    amountRange,
    tickerType: cleanStr(row.TickerType),
    excessReturn: cleanNum(row.ExcessReturn),
    priceChange: cleanNum(row.PriceChange),
    spyChange: cleanNum(row.SPYChange),
    description: cleanStr(row.Description),
    owner: null,
    district: null,
    state: null,
    source: "quiver",
    fetchedAt,
  };
}

export function normalizeBulkCongressTrade(
  row: QuiverBulkCongressTrade,
  fetchedAt: string
): NormalizedCongressTrade | null {
  const politicianName = cleanStr(row.Name);
  const transaction = cleanStr(row.Transaction);
  if (!politicianName || !transaction) return null;

  const bioguideId = normalizeBio(row.BioGuideID);
  const ticker = cleanStr(row.Ticker)?.toUpperCase() ?? null;
  const transactionDate = cleanIsoDate(row.Traded);
  const reportDate = cleanIsoDate(row.Filed);
  const amountRange =
    row.Trade_Size_USD != null ? String(row.Trade_Size_USD) : null;

  return {
    sourceHash: sha256(
      bioguideId,
      politicianName,
      ticker,
      transaction,
      transactionDate,
      reportDate,
      amountRange,
      cleanStr(row.Subholding),
      cleanStr(row.Description)
    ),
    bioguideId,
    politicianName,
    chamber: cleanStr(row.Chamber),
    party: cleanStr(row.Party),
    ticker,
    companyName: cleanStr(row.Company),
    transaction,
    transactionDate,
    reportDate,
    amount: amountRange,
    amountRange,
    tickerType: cleanStr(row.TickerType),
    excessReturn: cleanNum(row.excess_return),
    priceChange: null,
    spyChange: null,
    description: cleanStr(row.Description) || cleanStr(row.Comments),
    owner: cleanStr(row.Subholding),
    district: cleanStr(row.District),
    state: cleanStr(row.State),
    source: "quiver",
    fetchedAt,
  };
}

export function normalizePolitician(
  row: QuiverPolitician,
  fetchedAt: string
): NormalizedNetWorth | null {
  const bioguideId = normalizeBio(row.BioGuideID);
  const name = cleanStr(row.Name);
  if (!bioguideId || !name) return null;

  return {
    bioguideId,
    name,
    party: cleanStr(row.Party),
    chamber: cleanStr(row.Chamber),
    state: cleanStr(row.State),
    imageUrl: cleanStr(row.ImageURL),
    tradeCount: cleanNum(row.TradeCount) != null ? Math.round(cleanNum(row.TradeCount)!) : null,
    tradeVolume: cleanNum(row.TradeVolume),
    netWorth: cleanNum(row.NetWorth),
    source: "quiver",
    fetchedAt,
  };
}

export function normalizeDonor(
  row: QuiverCorporateDonor,
  fetchedAt: string
): NormalizedDonor | null {
  const candidateName = cleanStr(row.CandidateName);
  if (!candidateName) return null;
  const bioguideId = normalizeBio(row.BioGuideID);
  const amount = cleanNum(row.TransactionAmount);
  const cycle = cleanNum(row.Cycle);
  const ticker = cleanStr(row.Ticker)?.toUpperCase() ?? null;
  const companyCommitteeId = cleanStr(row.CompanyCMTEID);
  const companyCommitteeName = cleanStr(row.CompanyCMTENM);
  const transactionDate = cleanIsoDate(row.TransactionDate);

  return {
    sourceHash: sha256(
      bioguideId,
      candidateName,
      companyCommitteeId,
      companyCommitteeName,
      ticker,
      amount,
      cycle,
      transactionDate,
      cleanStr(row.TransactionType)
    ),
    bioguideId,
    candidateName,
    companyCommitteeName,
    transactionDate,
    transactionAmount: amount,
    ticker,
    committeeName: cleanStr(row.CommitteeName),
    cycle: cycle != null ? Math.round(cycle) : null,
    transactionType: cleanStr(row.TransactionType),
    companyCommitteeId,
    source: "quiver",
    fetchedAt,
  };
}

export function normalizeContract(
  row: QuiverGovContract,
  fetchedAt: string
): NormalizedContract | null {
  const ticker = cleanStr(row.Ticker)?.toUpperCase();
  if (!ticker) return null;
  const awardDate = cleanIsoDate(row.Date);
  const actionDate = cleanIsoDate(row.action_date);
  const description = cleanStr(row.Description);
  const agency = cleanStr(row.Agency);
  const amount = cleanNum(row.Amount);

  return {
    sourceHash: sha256(ticker, awardDate, actionDate, agency, description, amount),
    ticker,
    vendor: ticker,
    agency,
    awardDate,
    actionDate,
    description,
    amount,
    status: "active",
    source: "quiver",
    fetchedAt,
  };
}

export function normalizeLobbying(
  row: QuiverLobbying,
  fetchedAt: string
): NormalizedLobbying | null {
  const ticker = cleanStr(row.Ticker)?.toUpperCase() ?? null;
  const date = cleanIsoDate(row.Date);
  const client = cleanStr(row.Client);
  const issue = cleanStr(row.Issue);
  const specificIssue = cleanStr(row.Specific_Issue);
  const registrant = cleanStr(row.Registrant);
  const amount = cleanNum(row.Amount);
  if (!client && !ticker && !issue) return null;

  return {
    sourceHash: sha256(ticker, date, client, issue, specificIssue, registrant, amount),
    ticker,
    date,
    amount,
    client,
    issue,
    specificIssue,
    registrant,
    source: "quiver",
    fetchedAt,
  };
}

export function normalizeOffExchange(
  row: QuiverOffExchange,
  fetchedAt: string
): NormalizedOffExchange | null {
  const ticker = cleanStr(row.Ticker)?.toUpperCase();
  if (!ticker) return null;
  const date = cleanIsoDate(row.Date);
  return {
    sourceHash: sha256(ticker, date, row.OTC_Short, row.OTC_Total, row.DPI),
    ticker,
    date,
    otcShort: cleanNum(row.OTC_Short),
    otcTotal: cleanNum(row.OTC_Total),
    dpi: cleanNum(row.DPI),
    source: "quiver",
    fetchedAt,
  };
}

export function normalizeTrumpTrade(
  row: QuiverTrumpTrade,
  fetchedAt: string
): NormalizedTrumpTrade | null {
  const amount = cleanStr(row.Amount);
  const transaction = cleanStr(row.Transaction);
  const company = cleanStr(row.Company);
  const ticker = cleanStr(row.Ticker)?.toUpperCase() ?? null;
  const transactionDate = cleanIsoDate(row.Traded);
  const reportDate = cleanIsoDate(row.Filed);
  if (!transaction && !company && !ticker) return null;

  return {
    sourceHash: sha256(
      ticker,
      company,
      transaction,
      transactionDate,
      reportDate,
      amount
    ),
    ticker,
    company,
    transaction,
    transactionDate,
    reportDate,
    amount,
    amountRange: amount,
    excessReturn: cleanNum(row.ExcessReturn),
    source: "quiver",
    fetchedAt,
  };
}
