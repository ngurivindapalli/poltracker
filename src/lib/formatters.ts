/**
 * Shared formatters for currency, dates, and other display values
 */

/**
 * Format currency in compact form (e.g., $8.0K, $325K, $1.5M)
 */
export function formatCompactCurrency(value: number): string {
  if (value >= 1000000) {
    const millions = value / 1000000;
    if (millions >= 10) {
      return `$${millions.toFixed(0)}M`;
    }
    return `$${millions.toFixed(1)}M`;
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    if (thousands >= 100) {
      return `$${thousands.toFixed(0)}K`;
    }
    return `$${thousands.toFixed(1)}K`;
  }
  return `$${Math.round(value).toLocaleString()}`;
}

/**
 * Format currency in full form with commas (e.g., $1,234,567)
 */
export function formatFullCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

/**
 * Format date in human-readable form (e.g., "Jan 15, 2024")
 */
export function formatDateHuman(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format date in short form (e.g., "01/15/2024")
 */
export function formatDateShort(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
