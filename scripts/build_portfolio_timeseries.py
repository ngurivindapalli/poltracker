"""
Build portfolio time series data for each senator.

Since the scraped data doesn't include transaction type (buy/sell) or amount ranges,
we'll create a simplified version that shows:
- Trade activity over time (count of trades per week)
- Top tickers traded
- Trade summary statistics

Output:
- public/data/portfolio_timeseries/<senator-slug>.json
- public/data/portfolio_timeseries/<senator-slug>_summary.json
"""

import json
import os
import re
from datetime import datetime, timedelta
from collections import defaultdict

INPUT = "../public/data/senateTrades.json"
OUTPUT_DIR = "../public/data/portfolio_timeseries"

def to_slug(name: str) -> str:
    """Convert senator name to URL-safe slug."""
    if not name:
        return "unknown"
    # lowercase, replace spaces with hyphens, remove special chars
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")

def parse_date(date_str: str) -> datetime | None:
    """Parse date string to datetime."""
    if not date_str:
        return None
    try:
        # Try ISO format first
        return datetime.fromisoformat(date_str)
    except:
        pass
    try:
        # Try MM/DD/YYYY
        return datetime.strptime(date_str, "%m/%d/%Y")
    except:
        pass
    return None

def get_week_start(dt: datetime) -> str:
    """Get the Monday of the week for a given date."""
    monday = dt - timedelta(days=dt.weekday())
    return monday.strftime("%Y-%m-%d")

def main():
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Load trades
    with open(INPUT, "r", encoding="utf-8") as f:
        trades = json.load(f)
    
    print(f"Loaded {len(trades)} trades")
    
    # Group trades by senator
    by_senator = defaultdict(list)
    for t in trades:
        senator = t.get("senator") or "Unknown"
        by_senator[senator].append(t)
    
    print(f"Found {len(by_senator)} senators")
    
    # Calculate cutoff (4 years ago)
    cutoff = datetime.now() - timedelta(days=365 * 4)
    
    # Process each senator
    for senator, senator_trades in by_senator.items():
        slug = to_slug(senator)
        
        # Filter to last 4 years and parse dates
        valid_trades = []
        for t in senator_trades:
            date = parse_date(t.get("transactionDate"))
            if date and date >= cutoff:
                valid_trades.append({
                    **t,
                    "_parsed_date": date
                })
        
        if not valid_trades:
            continue
        
        # Sort by date
        valid_trades.sort(key=lambda x: x["_parsed_date"])
        
        # Build weekly time series (trade count per week)
        weekly_counts = defaultdict(int)
        for t in valid_trades:
            week = get_week_start(t["_parsed_date"])
            weekly_counts[week] += 1
        
        # Generate all weeks in range
        if valid_trades:
            start_date = valid_trades[0]["_parsed_date"]
            end_date = datetime.now()
            
            timeseries = []
            current = start_date - timedelta(days=start_date.weekday())  # Start from Monday
            cumulative = 0
            
            while current <= end_date:
                week_str = current.strftime("%Y-%m-%d")
                count = weekly_counts.get(week_str, 0)
                cumulative += count
                
                timeseries.append({
                    "date": week_str,
                    "tradeCount": count,
                    "cumulativeTrades": cumulative
                })
                
                current += timedelta(days=7)
        
        # Calculate summary statistics
        tickers = defaultdict(int)
        asset_types = defaultdict(int)
        years = defaultdict(int)
        
        for t in valid_trades:
            ticker = t.get("ticker")
            if ticker:
                tickers[ticker] += 1
            
            asset_type = t.get("assetType")
            if asset_type:
                asset_types[asset_type] += 1
            
            year = t["_parsed_date"].year
            years[year] += 1
        
        # Top tickers
        top_tickers = sorted(tickers.items(), key=lambda x: -x[1])[:10]
        
        # Summary
        summary = {
            "senator": senator,
            "slug": slug,
            "totalTrades": len(valid_trades),
            "uniqueTickers": len(tickers),
            "startDate": valid_trades[0]["_parsed_date"].strftime("%Y-%m-%d") if valid_trades else None,
            "endDate": valid_trades[-1]["_parsed_date"].strftime("%Y-%m-%d") if valid_trades else None,
            "topTickers": [{"ticker": t, "count": c} for t, c in top_tickers],
            "assetTypes": dict(asset_types),
            "tradesByYear": dict(years)
        }
        
        # Clean trades for output (remove internal fields)
        clean_trades = []
        for t in valid_trades:
            clean = {k: v for k, v in t.items() if not k.startswith("_")}
            clean_trades.append(clean)
        
        # Write time series
        ts_path = os.path.join(OUTPUT_DIR, f"{slug}.json")
        with open(ts_path, "w", encoding="utf-8") as f:
            json.dump(timeseries, f, indent=2)
        
        # Write summary
        summary_path = os.path.join(OUTPUT_DIR, f"{slug}_summary.json")
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)
        
        # Write trades list
        trades_path = os.path.join(OUTPUT_DIR, f"{slug}_trades.json")
        with open(trades_path, "w", encoding="utf-8") as f:
            json.dump(clean_trades, f, indent=2)
        
        print(f"  {senator}: {len(valid_trades)} trades, {len(tickers)} tickers")
    
    # Write index of all senators
    index = []
    for senator in sorted(by_senator.keys()):
        slug = to_slug(senator)
        summary_path = os.path.join(OUTPUT_DIR, f"{slug}_summary.json")
        if os.path.exists(summary_path):
            with open(summary_path, "r", encoding="utf-8") as f:
                summary = json.load(f)
                index.append({
                    "senator": senator,
                    "slug": slug,
                    "totalTrades": summary.get("totalTrades", 0),
                    "uniqueTickers": summary.get("uniqueTickers", 0)
                })
    
    index_path = os.path.join(OUTPUT_DIR, "_index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2)
    
    print(f"\nSaved {len(index)} senator portfolios to {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
