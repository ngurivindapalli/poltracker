"""Shared normalization helpers for Excel imports."""

from __future__ import annotations

import hashlib
import re
from datetime import date, datetime
from typing import Any, Optional, Tuple

US_STATE_TO_CODE = {
    "alabama": "AL",
    "alaska": "AK",
    "arizona": "AZ",
    "arkansas": "AR",
    "california": "CA",
    "colorado": "CO",
    "connecticut": "CT",
    "delaware": "DE",
    "florida": "FL",
    "georgia": "GA",
    "hawaii": "HI",
    "idaho": "ID",
    "illinois": "IL",
    "indiana": "IN",
    "iowa": "IA",
    "kansas": "KS",
    "kentucky": "KY",
    "louisiana": "LA",
    "maine": "ME",
    "maryland": "MD",
    "massachusetts": "MA",
    "michigan": "MI",
    "minnesota": "MN",
    "mississippi": "MS",
    "missouri": "MO",
    "montana": "MT",
    "nebraska": "NE",
    "nevada": "NV",
    "new hampshire": "NH",
    "new jersey": "NJ",
    "new mexico": "NM",
    "new york": "NY",
    "north carolina": "NC",
    "north dakota": "ND",
    "ohio": "OH",
    "oklahoma": "OK",
    "oregon": "OR",
    "pennsylvania": "PA",
    "rhode island": "RI",
    "south carolina": "SC",
    "south dakota": "SD",
    "tennessee": "TN",
    "texas": "TX",
    "utah": "UT",
    "vermont": "VT",
    "virginia": "VA",
    "washington": "WA",
    "west virginia": "WV",
    "wisconsin": "WI",
    "wyoming": "WY",
    "district of columbia": "DC",
}


def clean_str(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, float) and value != value:  # NaN
        return None
    s = str(value).strip()
    if not s or s.lower() in {"nan", "none", "null", "n/a", "na", ""}:
        return None
    return s


def fingerprint(*parts: Any) -> str:
    raw = "|".join("" if p is None else str(p).strip().lower() for p in parts)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def parse_date(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.replace(tzinfo=None)
    if isinstance(value, date):
        return datetime(value.year, value.month, value.day)
    s = clean_str(value)
    if not s:
        return None
    # Excel serial date as number
    if re.fullmatch(r"\d+(\.\d+)?", s):
        try:
            n = float(s)
            if 20000 < n < 60000:  # rough Excel serial range
                from datetime import timedelta

                base = datetime(1899, 12, 30)
                return base + timedelta(days=n)
        except ValueError:
            pass
    for fmt in (
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%m/%d/%Y",
        "%m-%d-%Y",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
    ):
        try:
            return datetime.strptime(s[:19], fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(s.replace("Z", ""))
    except ValueError:
        return None


def parse_trade_size(value: Any) -> Tuple[Optional[int], Optional[int]]:
    """Parse STOCK Act ranges like '$1,001 - $15,000' or '$50,000,001+'."""
    s = clean_str(value)
    if not s:
        return None, None
    s = s.replace(",", "").replace("$", "").strip()
    if s.endswith("+"):
        digits = re.sub(r"[^\d.]", "", s)
        try:
            low = int(float(digits))
            return low, None
        except ValueError:
            return None, None
    m = re.match(r"([\d.]+)\s*[-–—]\s*([\d.]+)", s)
    if m:
        try:
            return int(float(m.group(1))), int(float(m.group(2)))
        except ValueError:
            return None, None
    digits = re.sub(r"[^\d.]", "", s)
    if digits:
        try:
            n = int(float(digits))
            return n, n
        except ValueError:
            return None, None
    return None, None


def normalize_tx_type(value: Any) -> str:
    s = (clean_str(value) or "unknown").lower()
    s = re.sub(r"\s+", " ", s)
    if "purchase" in s or s == "buy":
        return "purchase" if "partial" not in s else "purchase"
    if "sale" in s or "sell" in s:
        if "partial" in s:
            return "sale (partial)"
        if "full" in s:
            return "sale (full)"
        return "sale"
    if "exchange" in s:
        return "exchange"
    return s


def normalize_buy_sell(tx_type: str) -> str:
    t = (tx_type or "").lower()
    if "purchase" in t or t == "buy":
        return "buy"
    if "sale" in t or "sell" in t:
        return "sell"
    if "exchange" in t:
        return "exchange"
    return "unknown"


def normalize_chamber(value: Any) -> str:
    s = (clean_str(value) or "").lower()
    if "sen" in s:
        return "senate"
    return "house"


def normalize_state(value: Any) -> str:
    s = clean_str(value)
    if not s:
        return "XX"
    if len(s) == 2:
        return s.upper()
    code = US_STATE_TO_CODE.get(s.lower())
    if code:
        return code
    return s[:2].upper()


def split_name(full_name: str) -> Tuple[str, str]:
    parts = [p for p in full_name.strip().split() if p]
    if not parts:
        return "Unknown", "Unknown"
    if len(parts) == 1:
        return parts[0], parts[0]
    # Drop common suffixes for last-name extraction
    suffixes = {"jr", "jr.", "sr", "sr.", "ii", "iii", "iv", "v"}
    if parts[-1].lower().rstrip(".") in suffixes or parts[-1].lower() in suffixes:
        parts = parts[:-1]
    first = parts[0]
    last = parts[-1]
    return first, last


def parse_district(value: Any) -> Optional[int]:
    s = clean_str(value)
    if not s:
        return None
    try:
        return int(float(s))
    except ValueError:
        return None


def parse_amount_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        if value != value:  # NaN
            return None
        return float(value)
    s = clean_str(value)
    if not s:
        return None
    s = s.replace(",", "").replace("$", "").strip()
    try:
        return float(s)
    except ValueError:
        return None
