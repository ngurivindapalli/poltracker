import TrumpTradesPanel from "@/components/financials/TrumpTradesPanel";
import { QuiverSourceLabel } from "@/components/financials/QuiverSourceLabel";

export const metadata = {
  title: "Donald Trump Stock Trades | Politeia",
  description:
    "Donald Trump stock trades dataset from Quiver Quantitative (Hobbyist API).",
};

export default function TrumpTradesPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-8">
        <h1 className="text-[32px] font-bold text-[#1E3A5F] mb-2">
          Donald Trump Stock Trades
        </h1>
        <p className="text-[#64748B] max-w-2xl">
          Normalized disclosures from Quiver Quantitative’s Trump stock trades
          dataset (
          <code className="text-sm">GET /beta/bulk/trumpstocktrades</code>).
          Amount values are reported ranges, not exact fill prices.
        </p>
        <div className="mt-3">
          <QuiverSourceLabel />
        </div>
      </header>
      <TrumpTradesPanel limit={200} />
    </main>
  );
}
