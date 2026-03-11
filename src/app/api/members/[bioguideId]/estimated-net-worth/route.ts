export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
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
  
  // Find earliest term start date
  let earliestStart: string | null = null;
  
  for (const term of terms) {
    const startDate = term?.startDate || term?.startYear;
    if (!startDate) continue;
    
    // Convert to YYYY-MM-DD format
    let normalizedDate: string | null = null;
    
    if (typeof startDate === 'string') {
      // Try to parse various formats
      if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        normalizedDate = startDate;
      } else if (/^\d{4}$/.test(startDate)) {
        // Just year, use January 1st
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
          // Ignore parse errors
        }
      }
    } else if (typeof startDate === 'number') {
      // Year as number
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
    
    // Try to get office start date from member data
    let officeStart: string | null = null;
    
    try {
      // Only fetch if API key is available (optional)
      if (process.env.API_DATA_GOV_KEY) {
        const memberData = await fetchMember(bioguideId);
        const member = memberData?.member ?? memberData;
        if (member) {
          officeStart = getOfficeStartDate(member);
        }
      }
    } catch (error) {
      // If fetching member data fails, continue without office start date
      console.warn('Could not fetch member data for office start date:', error);
    }
    
    // Get time series and summary with error handling
    let series: any[] = [];
    let summary: any = {
      latestEstimate: 0,
      firstTradeDate: null,
      totalEstimatedPurchases: 0,
      totalEstimatedSales: 0,
      numberOfTrades: 0,
    };
    
    try {
      series = getEstimatedNetWorthSeries(bioguideId, officeStart || undefined);
      summary = getEstimatedNetWorthSummary(bioguideId, officeStart || undefined);
    } catch (tradingError: any) {
      // If trading dataset fails, return empty data instead of breaking
      console.error('Trading dataset error:', tradingError?.message || String(tradingError));
      // Continue with empty series and summary
    }
    
    return NextResponse.json({
      bioguideId,
      label: 'Estimated Disclosed Portfolio Value',
      disclaimer: 'Estimate based on public congressional trading disclosures and midpoint values of reported transaction ranges. This is not actual net worth.',
      officeStart: officeStart || null,
      firstTradeDate: summary.firstTradeDate,
      latestEstimate: summary.latestEstimate,
      totalEstimatedPurchases: summary.totalEstimatedPurchases,
      totalEstimatedSales: summary.totalEstimatedSales,
      numberOfTrades: summary.numberOfTrades,
      series: series.length > 0 ? series : [],
    });
  } catch (error: any) {
    // Catch-all error handler - return empty but valid response
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
