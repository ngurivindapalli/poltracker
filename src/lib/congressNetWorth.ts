/**
 * Congressional Trading Disclosure Analysis
 * 
 * Estimates disclosed portfolio value over time based on public trade disclosures.
 * IMPORTANT: This is NOT actual net worth - it's an estimate based on:
 * - Public congressional trading disclosures
 * - Midpoint values of reported transaction ranges
 * - Cumulative estimated position flow
 * 
 * Assets outside disclosures and starting holdings are unknown.
 * 
 * NOTE: This module uses lazy loading to prevent interference with other routes.
 * The dataset is only loaded when functions are called, not on import.
 */

type TradingRow = {
  BioGuideID: string;
  Name?: string;
  Traded?: string;
  Filed?: string;
  Transaction?: string;
  Trade_Size_USD?: string;
  Company?: string;
  Ticker?: string;
  Chamber?: string;
  Party?: string;
  State?: string;
};

type TimeSeriesPoint = {
  date: string; // YYYY-MM-DD
  value: number;
};

type NetWorthSummary = {
  latestEstimate: number;
  firstTradeDate: string | null;
  totalEstimatedPurchases: number;
  totalEstimatedSales: number;
  numberOfTrades: number;
};

// Trade size range mappings to midpoint estimates
const TRADE_SIZE_MIDPOINTS: Record<string, number> = {
  '$1,001 - $15,000': 8000,
  '$15,001 - $50,000': 32500,
  '$50,001 - $100,000': 75000,
  '$100,001 - $250,000': 175000,
  '$250,001 - $500,000': 375000,
  '$500,001 - $1,000,000': 750000,
  '$1,000,001 - $5,000,000': 3000000,
  '$5,000,001 - $25,000,000': 15000000,
  '$25,000,001 - $50,000,000': 37500000,
  '$50,000,001+': 50000000,
};

// Normalize trade size string to key
function normalizeTradeSizeKey(size: string | null | undefined): string | null {
  if (!size) return null;
  const normalized = size.trim();
  
  // Direct match
  if (TRADE_SIZE_MIDPOINTS[normalized]) {
    return normalized;
  }
  
  // Try case-insensitive match
  const lower = normalized.toLowerCase();
  for (const key of Object.keys(TRADE_SIZE_MIDPOINTS)) {
    if (key.toLowerCase() === lower) {
      return key;
    }
  }
  
  return null;
}

/**
 * Estimate trade value from disclosure range
 * Returns null if range cannot be parsed
 */
export function estimateTradeValue(tradeSize: string | null | undefined): number | null {
  if (!tradeSize) return null;
  
  const key = normalizeTradeSizeKey(tradeSize);
  if (key) {
    return TRADE_SIZE_MIDPOINTS[key];
  }
  
  return null;
}

/**
 * Normalize transaction direction
 * Returns: positive for purchases, negative for sales, 0 for unknown/neutral
 */
export function normalizeTransactionDirection(transaction: string | null | undefined): number {
  if (!transaction) return 0;
  
  const normalized = transaction.trim().toLowerCase();
  
  if (normalized.includes('purchase') || normalized.includes('buy')) {
    return 1;
  }
  
  if (
    normalized.includes('sale') ||
    normalized.includes('sell') ||
    normalized.includes('partial') ||
    normalized.includes('full')
  ) {
    return -1;
  }
  
  // Exchange - treat as 0 unless we have more context
  if (normalized.includes('exchange')) {
    return 0;
  }
  
  return 0;
}

/**
 * Parse date string to YYYY-MM-DD format
 * Handles various date formats
 */
function parseDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  
  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Try MM/DD/YYYY or M/D/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try other common formats
  try {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Ignore parse errors
  }
  
  return null;
}

/**
 * Get month key from date (YYYY-MM)
 */
function getMonthKey(date: string): string {
  return date.slice(0, 7);
}

/**
 * Generate all months between start and end (inclusive)
 */
function generateMonthRange(startDate: string, endDate: string): string[] {
  const months: string[] = [];
  const start = new Date(startDate + '-01');
  const end = new Date(endDate + '-01');
  
  const current = new Date(start);
  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
}

// Cache for loaded trading data
let tradingDataCache: TradingRow[] | null = null;

/**
 * Load trading data from JSON file
 * Uses lazy loading - only loads when called, not on module import
 */
function loadTradingData(): TradingRow[] {
  if (tradingDataCache) {
    return tradingDataCache;
  }
  
  try {
    // Lazy import fs and path to avoid top-level execution
    const fs = require('fs');
    const path = require('path');
    
    // Load from src/data directory
    const dataPath = path.join(process.cwd(), 'src', 'data', 'congress-trading-all.json');
    
    // Check if file exists
    if (!fs.existsSync(dataPath)) {
      console.warn('Trading dataset not found at:', dataPath);
      tradingDataCache = [];
      return [];
    }
    
    const raw = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(raw);
    tradingDataCache = Array.isArray(data) ? data : [];
    return tradingDataCache;
  } catch (error: any) {
    // Silently fail - don't break other routes
    console.error('Failed to load trading data:', error?.message || String(error));
    tradingDataCache = [];
    return [];
  }
}

/**
 * Get estimated net worth time series for a member
 * 
 * @param bioguideId - BioGuide ID of the member
 * @param officeStart - Optional office start date (YYYY-MM-DD). If provided, series starts here.
 * @returns Time series array with monthly cumulative estimates
 */
export function getEstimatedNetWorthSeries(
  bioguideId: string,
  officeStart?: string
): TimeSeriesPoint[] {
  const data = loadTradingData();
  
  // Filter to this member
  const memberTrades = data.filter(
    row => row.BioGuideID && row.BioGuideID.toUpperCase() === bioguideId.toUpperCase()
  );
  
  if (memberTrades.length === 0) {
    // Return empty series starting from office start if provided
    if (officeStart) {
      const startMonth = getMonthKey(officeStart);
      return [{ date: `${startMonth}-01`, value: 0 }];
    }
    return [];
  }
  
  // Parse office start date
  const officeStartDate = officeStart ? new Date(officeStart) : null;
  
  // Process and filter trades
  const processedTrades: Array<{
    date: Date;
    dateStr: string;
    value: number;
    transaction: string;
    tradeSize: string | null;
  }> = [];
  
  for (const trade of memberTrades) {
    // Get trade date (prefer Traded, fallback to Filed)
    const tradeDateStr = parseDate(trade.Traded) || parseDate(trade.Filed);
    if (!tradeDateStr) continue;
    
    const tradeDate = new Date(tradeDateStr);
    if (isNaN(tradeDate.getTime())) continue;
    
    // Filter out trades before office start
    if (officeStartDate && tradeDate < officeStartDate) {
      continue;
    }
    
    // Estimate trade value
    const tradeValue = estimateTradeValue(trade.Trade_Size_USD);
    if (tradeValue === null) continue;
    
    // Get transaction type
    const transaction = trade.Transaction || "";
    
    processedTrades.push({
      date: tradeDate,
      dateStr: tradeDateStr,
      value: tradeValue,
      transaction,
      tradeSize: trade.Trade_Size_USD || null,
    });
  }
  
  if (processedTrades.length === 0) {
    if (officeStart) {
      const startMonth = getMonthKey(officeStart);
      return [{ date: `${startMonth}-01`, value: 0 }];
    }
    return [];
  }
  
  // Sort by date
  processedTrades.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Position-based accounting
  let position = 0;
  const series: TimeSeriesPoint[] = [];
  
  // Add initial point at office start date if it's before the first trade
  if (officeStartDate && officeStart && processedTrades.length > 0) {
    const firstTradeDate = processedTrades[0].date;
    if (officeStartDate < firstTradeDate) {
      series.push({
        date: officeStart,
        value: 0,
      });
    }
  }
  
  for (const trade of processedTrades) {
    const transactionType = trade.transaction.toLowerCase();
    
    if (transactionType.includes("purchase") || transactionType.includes("buy")) {
      // Purchase: add to position
      position += trade.value;
    } else if (transactionType.includes("sale") || transactionType.includes("sell")) {
      // Sale: subtract from position, but never go below 0
      position = Math.max(position - trade.value, 0);
    }
    // Skip exchanges and unknown transaction types
    
    // Add point to series
    series.push({
      date: trade.dateStr,
      value: position,
    });
  }
  
  // Filter series to start at office date if provided (safety check)
  if (officeStartDate) {
    return series.filter(point => {
      const pointDate = new Date(point.date);
      return !isNaN(pointDate.getTime()) && pointDate >= officeStartDate;
    });
  }
  
  return series;
}

/**
 * Get summary statistics for a member's estimated disclosed portfolio
 */
export function getEstimatedNetWorthSummary(
  bioguideId: string,
  officeStart?: string
): NetWorthSummary {
  const data = loadTradingData();
  
  const memberTrades = data.filter(
    row => row.BioGuideID && row.BioGuideID.toUpperCase() === bioguideId.toUpperCase()
  );
  
  if (memberTrades.length === 0) {
    return {
      latestEstimate: 0,
      firstTradeDate: null,
      totalEstimatedPurchases: 0,
      totalEstimatedSales: 0,
      numberOfTrades: 0,
    };
  }
  
  // Parse office start date for filtering
  const officeStartDate = officeStart ? new Date(officeStart) : null;
  
  // Filter trades to only those after office start
  const filteredTrades = memberTrades.filter(trade => {
    const tradeDateStr = parseDate(trade.Traded) || parseDate(trade.Filed);
    if (!tradeDateStr) return false;
    
    const tradeDate = new Date(tradeDateStr);
    if (isNaN(tradeDate.getTime())) return false;
    
    // Filter out trades before office start
    if (officeStartDate && tradeDate < officeStartDate) {
      return false;
    }
    
    return true;
  });
  
  if (filteredTrades.length === 0) {
    return {
      latestEstimate: 0,
      firstTradeDate: null,
      totalEstimatedPurchases: 0,
      totalEstimatedSales: 0,
      numberOfTrades: 0,
    };
  }
  
  let totalPurchases = 0;
  let totalSales = 0;
  let firstTradeDate: string | null = null;
  
  for (const trade of filteredTrades) {
    const tradeDate = parseDate(trade.Traded) || parseDate(trade.Filed);
    if (!tradeDate) continue;
    
    const tradeValue = estimateTradeValue(trade.Trade_Size_USD);
    if (tradeValue === null) continue;
    
    const direction = normalizeTransactionDirection(trade.Transaction);
    if (direction === 0) continue;
    
    if (!firstTradeDate || tradeDate < firstTradeDate) {
      firstTradeDate = tradeDate;
    }
    
    if (direction > 0) {
      totalPurchases += tradeValue;
    } else {
      totalSales += tradeValue;
    }
  }
  
  // Get latest estimate from series
  const series = getEstimatedNetWorthSeries(bioguideId, officeStart);
  const latestEstimate = series.length > 0 ? series[series.length - 1].value : 0;
  
  return {
    latestEstimate,
    firstTradeDate,
    totalEstimatedPurchases: totalPurchases,
    totalEstimatedSales: totalSales,
    numberOfTrades: filteredTrades.length,
  };
}
