export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { calculateNetWorthFromHoldings, parseRange } from '@/lib/networth';
import { getHoldingsForPolitician } from '@/lib/holdingsProvider';
import { getTradesForPolitician } from '@/lib/congressNetWorth';
import { getEstimatedNetWorthSeries, getEstimatedNetWorthSummary } from '@/lib/congressNetWorth';
import { fetchMember } from '@/lib/congress';

/**
 * Get office start date from member terms
 */
function getOfficeStartDate(member: any): string | null {
  const terms = (member?.terms?.item ?? member?.terms ?? []) as any[];
  
  if (terms.length === 0) {
    return null;
  }
  
  let earliestStart: string | null = null;
  
  for (const term of terms) {
    const startDate = term?.startDate || term?.startYear;
    if (!startDate) continue;
    
    let normalizedDate: string | null = null;
    
    if (typeof startDate === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        normalizedDate = startDate;
      } else if (/^\d{4}$/.test(startDate)) {
        normalizedDate = `${startDate}-01-01`;
      } else {
        try {
          const date = new Date(startDate);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            normalizedDate = `${year}-${month}-${day}`;
          }
        } catch {
          // Ignore
        }
      }
    } else if (typeof startDate === 'number') {
      normalizedDate = `${startDate}-01-01`;
    }
    
    if (normalizedDate && (!earliestStart || normalizedDate < earliestStart)) {
      earliestStart = normalizedDate;
    }
  }
  
  return earliestStart;
}

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const bioguideId = params?.bioguideId;
  
  if (!bioguideId) {
    return NextResponse.json(
      { error: 'Missing bioguideId' },
      { status: 400 }
    );
  }
  
  try {
    let officeStart: string | null = null;
    
    try {
      if (process.env.API_DATA_GOV_KEY) {
        const memberData = await fetchMember(bioguideId);
        const member = memberData?.member ?? memberData;
        if (member) {
          officeStart = getOfficeStartDate(member);
        }
      }
    } catch (error) {
      console.warn('Could not fetch member data for office start date:', error);
    }
    
    const holdings = getHoldingsForPolitician(bioguideId);
    const trades = getTradesForPolitician(bioguideId);
    
    let netWorth = 0;
    if (holdings && holdings.length > 0) {
      netWorth = calculateNetWorthFromHoldings(holdings);
    }
    // Fallback if no holdings: use 10% of total trade value
    if (netWorth === 0 && trades?.length > 0) {
      netWorth = Math.round(
        trades.reduce((sum: number, t: any) => sum + parseRange(t.amount), 0) * 0.1
      );
    }
    
    // Trade stats for chart (from congressNetWorth for consistency)
    let summary = { firstTradeDate: null as string | null, totalEstimatedPurchases: 0, totalEstimatedSales: 0 };
    try {
      summary = getEstimatedNetWorthSummary(bioguideId, officeStart || undefined);
    } catch {
      // Compute from trades if congressNetWorth fails
      let totalPurchases = 0;
      let totalSales = 0;
      let firstTradeDate: string | null = null;
      for (const t of trades || []) {
        const value = parseRange(t.amount);
        if (t.type === 'purchase') {
          totalPurchases += value;
          if (t.transactionDate && (!firstTradeDate || t.transactionDate < firstTradeDate)) {
            firstTradeDate = t.transactionDate;
          }
        } else {
          totalSales += value;
          if (t.transactionDate && (!firstTradeDate || t.transactionDate < firstTradeDate)) {
            firstTradeDate = t.transactionDate;
          }
        }
      }
      summary = { firstTradeDate, totalEstimatedPurchases: totalPurchases, totalEstimatedSales: totalSales };
    }
    
    // Chart series: use trade series when available, else holdings value
    let series: Array<{ date: string; value: number }> = [];
    try {
      series = getEstimatedNetWorthSeries(bioguideId, officeStart || undefined);
    } catch {
      // Ignore
    }
    
    if (!series || series.length === 0) {
      series = [{ date: '2024-01-01', value: netWorth }];
    }
    
    return NextResponse.json({
      bioguideId,
      label: 'Estimated Disclosed Portfolio Value',
      disclaimer: 'Estimate based on public congressional trading disclosures and midpoint values of reported transaction ranges. This is not actual net worth.',
      officeStart: officeStart || null,
      firstTradeDate: summary.firstTradeDate,
      latestEstimate: netWorth,
      totalEstimatedPurchases: summary.totalEstimatedPurchases,
      totalEstimatedSales: summary.totalEstimatedSales,
      numberOfTrades: trades?.length || 0,
      series: series.length > 0 ? series : [],
    });
  } catch (error: any) {
    console.error('Error in estimated-net-worth API:', error?.message || String(error));
    return NextResponse.json({
      bioguideId: bioguideId || 'unknown',
      label: 'Estimated Disclosed Portfolio Value',
      disclaimer: 'Estimate based on public congressional trading disclosures and midpoint values of reported transaction ranges. This is not actual net worth.',
      officeStart: null,
      firstTradeDate: null,
      latestEstimate: 0,
      totalEstimatedPurchases: 0,
      totalEstimatedSales: 0,
      numberOfTrades: 0,
      series: [],
    });
  }
}
