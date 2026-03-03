import json
import re
from datetime import datetime

INPUT = "senateTrades_fixed.json"   # or senateTrades.json if that's your current fixed file
OUTPUT = "senateTrades_final.json"

TICKER_RE = re.compile(r"^[A-Z]{1,6}(\.[A-Z]{1,2})?$")

def clean_text(s: str) -> str:
    if not s:
        return s
    # collapse whitespace/newlines
    s = re.sub(r"\s+", " ", s).strip()
    return s

def to_iso_date(mmddyyyy: str) -> str | None:
    if not mmddyyyy:
        return None
    mmddyyyy = mmddyyyy.strip()
    try:
        return datetime.strptime(mmddyyyy, "%m/%d/%Y").date().isoformat()
    except Exception:
        # already iso?
        try:
            return datetime.fromisoformat(mmddyyyy).date().isoformat()
        except Exception:
            return None

def looks_like_ticker(s: str) -> bool:
    if not s:
        return False
    s = s.strip().upper()
    return bool(TICKER_RE.match(s))

with open(INPUT, "r", encoding="utf-8") as f:
    data = json.load(f)

out = []
for t in data:
    asset = clean_text(t.get("asset"))
    raw_owner = clean_text(t.get("rawOwner"))
    owner = clean_text(t.get("owner"))
    asset_type = clean_text(t.get("assetType"))

    # Normalize date
    tx_date_iso = to_iso_date(t.get("transactionDate"))
    report_date = t.get("reportDate")  # already ISO in your sample

    ticker = None
    asset_name = asset

    # Case A: asset itself is just a ticker (RBLX)
    if looks_like_ticker(asset):
        ticker = asset.strip().upper()
        asset_name = None  # unknown (we only got ticker)
    # Case B: rawOwner contains ticker (YUM)
    elif looks_like_ticker(raw_owner):
        ticker = raw_owner.strip().upper()

    # If asset includes something like "XYZ - Company Name" (rare), extract
    if not ticker and asset:
        m = re.match(r"^([A-Z]{1,6})(\.[A-Z]{1,2})?\b", asset.strip())
        if m and looks_like_ticker(m.group(0)):
            ticker = m.group(0).upper()

    out.append({
        "senator": clean_text(t.get("senator")),
        "office": clean_text(t.get("office")),
        "reportTitle": clean_text(t.get("reportTitle")),
        "reportDate": report_date,
        "reportUrl": t.get("reportUrl"),

        "transactionDate": tx_date_iso or t.get("transactionDate"),
        "owner": owner,
        "ticker": ticker,
        "asset": asset_name,
        "assetType": asset_type,

        # keep originals for debugging (optional)
        "rawOwner": raw_owner,
    })

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)

print("Saved", OUTPUT, "records:", len(out))
