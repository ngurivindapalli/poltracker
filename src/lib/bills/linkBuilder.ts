export interface BillLinkData {
  congress: string | number
  type: string
  number: string | number
}

/**
 * Build a Congress.gov bill link from bill data
 */
export function buildBillLink(bill: BillLinkData): string {
  const congress = String(bill.congress || '118')
  const type = String(bill.type || '').toLowerCase()
  const number = String(bill.number || '')
  
  // Convert bill type to Congress.gov format
  let typePath = type
  if (type === 's') {
    typePath = 'senate-bill'
  } else if (type === 'hr' || type === 'h') {
    typePath = 'house-bill'
  } else if (type === 'hres') {
    typePath = 'house-resolution'
  } else if (type === 'sres') {
    typePath = 'senate-resolution'
  } else if (type) {
    typePath = `${type}-bill`
  }
  
  return `https://www.congress.gov/bill/${congress}th-congress/${typePath}/${number}`
}
