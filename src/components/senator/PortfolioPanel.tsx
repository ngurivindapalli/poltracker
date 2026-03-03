"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table, TableRow, TableCell } from "@/components/ui/Table";

interface PortfolioPanelProps {
  bioguideId: string;
  senatorName?: string;
}

interface Trade {
  senator?: string;
  ticker?: string;
  asset?: string;
  assetType?: string;
  type?: string;
  transactionDate?: string;
  amount?: string;
  owner?: string;
  reportUrl?: string;
}

interface TickerCount {
  [ticker: string]: number;
}

export default function PortfolioPanel({ bioguideId, senatorName }: PortfolioPanelProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        if (senatorName) {
          // Use local STOCK Act data
          const res = await fetch(`/api/investments/${encodeURIComponent(senatorName)}`);
          const data = await res.json();
          // API returns { trades, count }
          setTrades(Array.isArray(data.trades) ? data.trades : []);
        } else {
          // Fallback to old portfolio API
          const res = await fetch(`/api/member/${bioguideId}/portfolio`);
          const data = await res.json();
          setTrades(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching trades:", err);
        setTrades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [bioguideId, senatorName]);

  if (loading) {
    return (
      <Card className="mt-8 p-8 text-center text-[#64748B]">
        Loading investment portfolio...
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card className="mt-8 p-8 text-center text-[#64748B]">
        No investment data available for this senator.
      </Card>
    );
  }

  // Calculate top holdings
  const tickers: TickerCount = {};
  trades.forEach((t) => {
    if (t.ticker) {
      if (!tickers[t.ticker]) tickers[t.ticker] = 0;
      tickers[t.ticker]++;
    }
  });

  const topHoldings = Object.entries(tickers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <Card className="mt-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold text-[#1E3A5F]">
          Investment Portfolio
        </h2>
        <p className="text-[14px] text-[#64748B]">
          Recent stock trades and financial disclosures
        </p>
      </div>

      {/* Top Holdings Summary */}
      {topHoldings.length > 0 && (
        <div className="mb-6 p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
          <h3 className="text-[16px] font-semibold text-[#1E3A5F] mb-3">
            Top Holdings
          </h3>
          <div className="flex flex-wrap gap-2">
            {topHoldings.map(([ticker, count]) => (
              <span
                key={ticker}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#2563EB]/10 text-[#2563EB]"
              >
                {ticker}
                <span className="ml-1.5 text-[11px] text-[#64748B]">
                  ({count} {count === 1 ? "trade" : "trades"})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trades Table */}
      <Table headers={["Ticker", "Asset", "Type", "Date", "Report"]}>
        {trades.slice(0, 20).map((trade, i) => (
          <TableRow key={i}>
            <TableCell className="font-medium text-[#1E3A5F]">
              {trade.ticker ? (
                <span className="inline-flex px-2 py-0.5 rounded text-[13px] font-semibold bg-[#2563EB]/10 text-[#2563EB]">
                  {trade.ticker}
                </span>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="text-[#374151] max-w-[200px] truncate">
              {trade.asset || "—"}
            </TableCell>
            <TableCell>
              <span className="inline-flex px-2 py-0.5 rounded text-[12px] font-medium bg-[#F1F5F9] text-[#64748B]">
                {trade.assetType || "—"}
              </span>
            </TableCell>
            <TableCell className="text-[#64748B]">
              {trade.transactionDate || "—"}
            </TableCell>
            <TableCell>
              {trade.reportUrl ? (
                <a
                  href={trade.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-[#2563EB] hover:underline"
                >
                  View →
                </a>
              ) : (
                "—"
              )}
            </TableCell>
          </TableRow>
        ))}
      </Table>

      {trades.length > 20 && (
        <p className="mt-4 text-[13px] text-[#64748B] text-center">
          Showing 20 of {trades.length} trades
        </p>
      )}
    </Card>
  );
}
