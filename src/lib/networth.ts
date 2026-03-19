export function parseRange(value: string): number {
  if (!value) return 0;

  const cleaned = value.replace(/[$,]/g, "").trim();

  if (cleaned.includes("-")) {
    const [low, high] = cleaned.split("-").map(Number);
    if (!isNaN(low) && !isNaN(high)) {
      return (low + high) / 2;
    }
  }

  if (cleaned.toLowerCase().includes("over")) {
    const num = Number(cleaned.replace(/[^\d]/g, ""));
    return num * 1.25;
  }

  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

export function calculateNetWorth({
  holdings,
  trades,
}: {
  holdings: any[];
  trades: any[];
}) {
  let holdingsTotal = 0;

  // PRIMARY SOURCE: HOLDINGS
  for (const asset of holdings || []) {
    holdingsTotal += parseRange(asset.amount);
  }

  // SECONDARY: TRADES (small adjustment)
  let tradeImpact = 0;

  for (const trade of trades || []) {
    const value = parseRange(trade.amount);

    if (trade.type === "purchase") {
      tradeImpact += value * 0.05; // small weight
    } else {
      tradeImpact -= value * 0.05;
    }
  }

  const total = holdingsTotal + tradeImpact;

  return {
    totalNetWorth: Math.max(0, Math.round(total)),
    holdingsTotal: Math.round(holdingsTotal),
    tradeImpact: Math.round(tradeImpact),
  };
}

export function calculateNetWorthFromHoldings(holdings: any[]): number {
  if (!holdings || holdings.length === 0) return 0;
  let total = 0;
  for (const asset of holdings) {
    total += parseRange(asset.amount);
  }
  return Math.round(total);
}
