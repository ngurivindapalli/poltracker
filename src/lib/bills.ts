/**
 * Converts a Congress API bill URL to a public Congress.gov URL
 * or generates one from bill data
 */
export function getPublicBillUrl(bill: any): string | null {
  // If we have congress, type, and number, construct the public URL
  if (bill?.congress && bill?.type && bill?.number) {
    const chamber = bill.type.toLowerCase().startsWith('s') ? 'senate' : 'house'
    return `https://www.congress.gov/bill/${bill.congress}th-congress/${chamber}-bill/${bill.number}`
  }

  // If there's a URL from the API, try to convert it
  if (bill?.url) {
    const url = bill.url
    // If it's already a public congress.gov URL, return it
    if (url.includes('www.congress.gov')) {
      return url
    }
    // If it's an API URL, try to extract the bill info
    const match = url.match(/\/bill\/(\d+)\/([sh])\/(\d+)/)
    if (match) {
      const [, congress, type, number] = match
      const chamber = type.toLowerCase() === 's' ? 'senate' : 'house'
      return `https://www.congress.gov/bill/${congress}th-congress/${chamber}-bill/${number}`
    }
  }

  return null
}
