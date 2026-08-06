"""Rebuild portfolio_snapshots and lightweight summary JSON from imported trades."""

from __future__ import annotations

import json
import logging
import uuid
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import select
from sqlalchemy.orm import Session

from services.db import ROOT, session_scope
from services.models import Member, PortfolioSnapshot, PtrFiling, PtrTransaction

logger = logging.getLogger(__name__)

# Midpoints for STOCK Act ranges (same ideas as src/lib/congressNetWorth.ts)
TRADE_SIZE_MIDPOINTS = {
    (1001, 15000): 8000,
    (15001, 50000): 32500,
    (50001, 100000): 75000,
    (100001, 250000): 175000,
    (250001, 500000): 375000,
    (500001, 1000000): 750000,
    (1000001, 5000000): 3000000,
    (5000001, 25000000): 15000000,
    (25000001, 50000000): 37500000,
}


def _midpoint(lo: int | None, hi: int | None, buy_sell: str | None) -> float:
    if lo is None and hi is None:
        return 0.0
    if lo is not None and hi is not None:
        for (a, b), mid in TRADE_SIZE_MIDPOINTS.items():
            if lo == a and hi == b:
                return float(mid)
        return (lo + hi) / 2.0
    return float(lo if lo is not None else hi or 0)


def recalculate_summaries() -> Dict[str, int]:
    stats = {"members": 0, "snapshots": 0}

    with session_scope() as session:
        rows = session.execute(
            select(
                PtrFiling.bioguide_id,
                PtrTransaction.ticker,
                PtrTransaction.buy_sell,
                PtrTransaction.tx_type,
                PtrTransaction.amount_low,
                PtrTransaction.amount_high,
                PtrTransaction.tx_date,
            )
            .join(PtrTransaction, PtrTransaction.filing_id == PtrFiling.id)
            .order_by(PtrTransaction.tx_date.asc())
        ).all()

        by_member: Dict[str, List[Any]] = defaultdict(list)
        for r in rows:
            by_member[r.bioguide_id].append(r)

        now = datetime.utcnow()
        series_payload: Dict[str, List[Dict[str, Any]]] = {}

        for bioguide_id, trades in by_member.items():
            if not session.get(Member, bioguide_id):
                continue

            position = 0.0
            ticker_counts: Dict[str, int] = defaultdict(int)
            first_dt = None
            last_dt = None
            purchases = 0.0
            sales = 0.0
            series: List[Dict[str, Any]] = []

            for t in trades:
                mid = _midpoint(t.amount_low, t.amount_high, t.buy_sell)
                direction = (t.buy_sell or "").lower()
                tx = (t.tx_type or "").lower()
                if direction == "buy" or "purchase" in tx:
                    position += mid
                    purchases += mid
                elif direction == "sell" or "sale" in tx:
                    position = max(position - mid, 0.0)
                    sales += mid

                if t.ticker:
                    ticker_counts[t.ticker.upper()] += 1
                if t.tx_date:
                    if first_dt is None or t.tx_date < first_dt:
                        first_dt = t.tx_date
                    if last_dt is None or t.tx_date > last_dt:
                        last_dt = t.tx_date
                    series.append(
                        {
                            "date": t.tx_date.date().isoformat(),
                            "value": round(position, 2),
                        }
                    )

            top = sorted(ticker_counts.items(), key=lambda x: -x[1])[:10]
            top_holdings = [{"ticker": k, "tradeCount": v} for k, v in top]

            snap = session.execute(
                select(PortfolioSnapshot).where(
                    PortfolioSnapshot.bioguide_id == bioguide_id
                )
            ).scalar_one_or_none()
            if not snap:
                snap = PortfolioSnapshot(
                    id=str(uuid.uuid4()),
                    bioguide_id=bioguide_id,
                    estimated_portfolio_usd=position,
                    trade_count=len(trades),
                    first_trade_date=first_dt,
                    last_trade_date=last_dt,
                    top_holdings_json=json.dumps(top_holdings),
                    computed_at=now,
                )
                session.add(snap)
            else:
                snap.estimated_portfolio_usd = position
                snap.trade_count = len(trades)
                snap.first_trade_date = first_dt
                snap.last_trade_date = last_dt
                snap.top_holdings_json = json.dumps(top_holdings)
                snap.computed_at = now

            series_payload[bioguide_id] = series
            stats["members"] += 1
            stats["snapshots"] += 1

        session.commit()

    out = ROOT / "public" / "data" / "portfolio-summaries.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(series_payload, f)
    logger.info("Wrote portfolio series for %s members -> %s", len(series_payload), out)
    logger.info("Summaries complete: %s", stats)
    return stats


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    print(recalculate_summaries())
