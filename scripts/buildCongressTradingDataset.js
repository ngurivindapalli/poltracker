const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'congress-trading-all.xlsx');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'congress-trading-all.json');

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Reading XLSX file:', INPUT_FILE);

// Read the workbook
const workbook = XLSX.readFile(INPUT_FILE);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

console.log(`Loaded ${rawData.length} rows from spreadsheet`);

// Normalize column names and structure
const normalized = rawData.map((row, index) => {
  // Handle various possible column name formats
  const getValue = (possibleNames) => {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return String(row[name]).trim();
      }
    }
    return null;
  };

  const normalizedRow = {
    BioGuideID: getValue(['BioGuideID', 'bioguide_id', 'bioguideId', 'BioGuide_ID', 'BioguideID']),
    Name: getValue(['Name', 'name', 'Member', 'member']),
    Traded: getValue(['Traded', 'traded', 'Trade_Date', 'trade_date', 'Transaction_Date', 'transaction_date']),
    Filed: getValue(['Filed', 'filed', 'File_Date', 'file_date', 'Filing_Date', 'filing_date']),
    Transaction: getValue(['Transaction', 'transaction', 'Transaction_Type', 'transaction_type', 'Type', 'type']),
    Trade_Size_USD: getValue(['Trade_Size_USD', 'trade_size_usd', 'Trade Size (USD)', 'Trade_Size', 'trade_size', 'Amount', 'amount']),
    Company: getValue(['Company', 'company', 'Asset', 'asset', 'Asset_Name', 'asset_name']),
    Ticker: getValue(['Ticker', 'ticker', 'Symbol', 'symbol']),
    Chamber: getValue(['Chamber', 'chamber', 'House', 'house']),
    Party: getValue(['Party', 'party', 'Party_Name', 'party_name']),
    State: getValue(['State', 'state', 'State_Code', 'state_code']),
  };

  // Only include rows with a BioGuideID
  if (!normalizedRow.BioGuideID) {
    return null;
  }

  return normalizedRow;
}).filter(row => row !== null);

console.log(`Normalized ${normalized.length} rows with BioGuideID`);

// Write to JSON file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(normalized, null, 2), 'utf8');

console.log(`✅ Successfully wrote ${normalized.length} rows to ${OUTPUT_FILE}`);
console.log(`Sample row:`, normalized[0]);
