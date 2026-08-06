"""
Import congressional trading disclosures from Excel into the existing Prisma schema.

Upserts Members by BioGuideID (never duplicates politicians).
Groups trades into PtrFiling + PtrTransaction rows.
Also refreshes JSON files used by the Next.js frontend.
"""

from __future__ import annotations

import json
import logging
import uuid
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import pandas as pd
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from services.db import ROOT, session_scope
from services.models import Member, PtrFiling, PtrTransaction
from services.normalize import (
    clean_str,
    fingerprint,
    normalize_buy_sell,
    normalize_chamber,
    normalize_state,
    normalize_tx_type,
    parse_date,
    parse_district,
    parse_trade_size,
    split_name,
)

logger = logging.getLogger(__name__)

DEFAULT_PATHS = [
    ROOT / "data" / "imports" / "congress-trading-all.xlsx",
    ROOT / "scripts" / "congress-trading-all.xlsx",
    Path.home() / "Downloads" / "congress-trading-all.xlsx",
    Path.home() / "Downloads" / "congress-trading-all (2).xlsx",
]

SOURCE_LABEL = "quiver"


def resolve_trading_path(path: Optional[str | Path] = None) -> Path:
    if path:
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Trading Excel not found: {p}")
        return p
    for candidate in DEFAULT_PATHS:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(
        "Trading Excel not found. Place congress-trading-all.xlsx under data/imports/ "
        "or pass --path."
    )


def _read_excel(path: Path) -> pd.DataFrame:
    logger.info("Reading trading workbook: %s", path)
    df = pd.read_excel(path, engine="openpyxl")
    logger.info("Loaded %s rows, columns=%s", len(df), list(df.columns))
    return df


def _row_get(row: pd.Series, *names: str) -> Any:
    for name in names:
        if name in row.index and pd.notna(row[name]):
            return row[name]
        # case-insensitive fallback
        for col in row.index:
            if str(col).lower() == name.lower() and pd.notna(row[col]):
                return row[col]
    return None


def normalize_trade_row(row: pd.Series) -> Optional[Dict[str, Any]]:
    bioguide = clean_str(_row_get(row, "BioGuideID", "bioguide_id", "bioguideId"))
    if not bioguide:
        return None

    name = clean_str(_row_get(row, "Name", "name", "Member")) or "Unknown"
    ticker = clean_str(_row_get(row, "Ticker", "ticker", "Symbol"))
    asset = clean_str(_row_get(row, "Company", "company", "Asset", "asset")) or (
        ticker or "Unknown asset"
    )
    asset_type = clean_str(_row_get(row, "TickerType", "asset_type", "AssetType"))
    transaction_raw = clean_str(
        _row_get(row, "Transaction", "transaction", "Type", "tx_type")
    )
    tx_type = normalize_tx_type(transaction_raw)
    buy_sell = normalize_buy_sell(tx_type)

    trade_date = parse_date(_row_get(row, "Traded", "traded", "Trade_Date", "transaction_date"))
    filing_date = parse_date(_row_get(row, "Filed", "filed", "Filing_Date", "file_date"))
    if not trade_date and not filing_date:
        return None
    if not trade_date:
        trade_date = filing_date
    if not filing_date:
        filing_date = trade_date

    amount_raw = _row_get(
        row, "Trade_Size_USD", "trade_size_usd", "Amount", "amount", "Trade Size (USD)"
    )
    amount_low, amount_high = parse_trade_size(amount_raw)
    owner = clean_str(_row_get(row, "Subholding", "owner", "Owner", "subholding"))
    comment = clean_str(
        _row_get(row, "Comments", "comments", "comment", "Description", "description")
    )
    # Prefer dedicated comment; keep Description when Comments empty
    if not comment:
        comment = clean_str(_row_get(row, "Description", "description"))

    chamber = normalize_chamber(_row_get(row, "Chamber", "chamber"))
    party = clean_str(_row_get(row, "Party", "party"))
    state = normalize_state(_row_get(row, "State", "state"))
    district = parse_district(_row_get(row, "District", "district"))
    first, last = split_name(name)

    fp = fingerprint(
        bioguide,
        ticker,
        asset,
        tx_type,
        trade_date.date().isoformat() if trade_date else "",
        amount_low,
        amount_high,
        owner,
        comment,
    )

    return {
        "bioguide_id": bioguide.upper(),
        "name": name,
        "first_name": first,
        "last_name": last,
        "chamber": chamber,
        "party": party,
        "state": state,
        "district": district if chamber == "house" else None,
        "ticker": ticker,
        "asset": asset,
        "asset_type": asset_type,
        "tx_type": tx_type,
        "buy_sell": buy_sell,
        "trade_date": trade_date,
        "filing_date": filing_date,
        "amount_low": amount_low,
        "amount_high": amount_high,
        "amount_raw": clean_str(amount_raw),
        "owner": owner,
        "comment": comment,
        "source": SOURCE_LABEL,
        "fingerprint": fp,
        "transaction_label": transaction_raw or tx_type,
    }


def _upsert_member(session: Session, trade: Dict[str, Any], cache: Dict[str, Member]) -> Member:
    bid = trade["bioguide_id"]
    if bid in cache:
        return cache[bid]

    existing = session.get(Member, bid)
    now = datetime.utcnow()
    if existing:
        # Keep existing IDs; lightly refresh metadata if empty/stale
        if trade["party"] and not existing.party:
            existing.party = trade["party"]
        if trade["state"] and existing.state in (None, "", "XX"):
            existing.state = trade["state"]
        existing.updated_at = now
        cache[bid] = existing
        return existing

    member = Member(
        bioguide_id=bid,
        first_name=trade["first_name"],
        last_name=trade["last_name"],
        chamber=trade["chamber"],
        party=trade["party"],
        state=trade["state"] or "XX",
        district=trade["district"],
        active=True,
        updated_at=now,
    )
    session.add(member)
    session.flush()
    cache[bid] = member
    logger.info("Created member %s (%s %s)", bid, trade["first_name"], trade["last_name"])
    return member


def _filing_source_url(bioguide: str, filing_date: datetime) -> str:
    return f"quiver://ptr/{bioguide}/{filing_date.date().isoformat()}"


def import_trading(
    path: Optional[str | Path] = None,
    *,
    write_json: bool = True,
    batch_size: int = 500,
    skip_db: bool = False,
) -> Dict[str, int]:
    excel_path = resolve_trading_path(path)
    df = _read_excel(excel_path)

    normalized: List[Dict[str, Any]] = []
    seen_fp: set[str] = set()
    skipped = 0
    for _, row in df.iterrows():
        trade = normalize_trade_row(row)
        if not trade:
            skipped += 1
            continue
        if trade["fingerprint"] in seen_fp:
            skipped += 1
            continue
        seen_fp.add(trade["fingerprint"])
        normalized.append(trade)

    logger.info(
        "Normalized %s unique trades (skipped %s empty/dupe rows)",
        len(normalized),
        skipped,
    )

    stats = {
        "rows_read": int(len(df)),
        "rows_normalized": len(normalized),
        "members_created": 0,
        "members_existing": 0,
        "filings_upserted": 0,
        "trades_inserted": 0,
        "trades_existing": 0,
        "skipped": skipped,
        "db_ok": False,
    }

    if not skip_db:
        try:
            with session_scope() as session:
                member_cache: Dict[str, Member] = {}
                filing_cache: Dict[Tuple[str, str], str] = {}

                existing_fps = set(
                    session.execute(
                        select(PtrTransaction.fingerprint).where(
                            PtrTransaction.fingerprint.is_not(None)
                        )
                    )
                    .scalars()
                    .all()
                )
                logger.info("Preloaded %s existing trade fingerprints", len(existing_fps))

                unique_bios = {t["bioguide_id"]: t for t in normalized}
                for bid, sample in unique_bios.items():
                    before = session.get(Member, bid)
                    _upsert_member(session, sample, member_cache)
                    if before:
                        stats["members_existing"] += 1
                    else:
                        stats["members_created"] += 1
                session.flush()

                buffer: List[Dict[str, Any]] = []
                now = datetime.utcnow()

                for i, trade in enumerate(normalized, start=1):
                    if trade["fingerprint"] in existing_fps:
                        stats["trades_existing"] += 1
                        continue

                    src = _filing_source_url(trade["bioguide_id"], trade["filing_date"])
                    fkey = (trade["bioguide_id"], src)
                    filing_id = filing_cache.get(fkey)
                    if not filing_id:
                        existing_filing = session.execute(
                            select(PtrFiling).where(
                                PtrFiling.bioguide_id == trade["bioguide_id"],
                                PtrFiling.source_url == src,
                            )
                        ).scalar_one_or_none()
                        if existing_filing:
                            filing_id = existing_filing.id
                        else:
                            filing_id = str(uuid.uuid4())
                            session.add(
                                PtrFiling(
                                    id=filing_id,
                                    bioguide_id=trade["bioguide_id"],
                                    chamber=trade["chamber"],
                                    filing_date=trade["filing_date"],
                                    source_url=src,
                                    raw_file_ref=str(excel_path.name),
                                    created_at=now,
                                )
                            )
                            stats["filings_upserted"] += 1
                        filing_cache[fkey] = filing_id

                    buffer.append(
                        {
                            "id": str(uuid.uuid4()),
                            "filing_id": filing_id,
                            "ticker": trade["ticker"],
                            "asset_desc": trade["asset"][:2000],
                            "asset_type": trade["asset_type"],
                            "tx_type": trade["tx_type"],
                            "buy_sell": trade["buy_sell"],
                            "amount_low": trade["amount_low"],
                            "amount_high": trade["amount_high"],
                            "tx_date": trade["trade_date"],
                            "owner": trade["owner"],
                            "comment": trade["comment"],
                            "source": trade["source"],
                            "fingerprint": trade["fingerprint"],
                        }
                    )
                    existing_fps.add(trade["fingerprint"])

                    if len(buffer) >= batch_size:
                        _flush_trades(session, buffer)
                        stats["trades_inserted"] += len(buffer)
                        logger.info(
                            "Progress: inserted batch (total new ~%s / %s)",
                            stats["trades_inserted"],
                            len(normalized),
                        )
                        buffer = []
                        session.commit()

                    if i % 10000 == 0:
                        logger.info("Scanned %s / %s normalized trades", i, len(normalized))

                if buffer:
                    _flush_trades(session, buffer)
                    stats["trades_inserted"] += len(buffer)
                    session.commit()
                stats["db_ok"] = True
        except Exception as exc:
            logger.exception("Database upsert failed (JSON files may still be written): %s", exc)
            stats["db_error"] = str(exc)

    if write_json:
        _write_frontend_json(normalized)

    logger.info("Trading import complete: %s", stats)
    return stats


def _flush_trades(session: Session, rows: List[Dict[str, Any]]) -> None:
    if not rows:
        return
    stmt = pg_insert(PtrTransaction.__table__).values(rows)
    stmt = stmt.on_conflict_do_nothing(index_elements=["fingerprint"])
    session.execute(stmt)
    session.flush()


def _write_frontend_json(trades: Iterable[Dict[str, Any]]) -> None:
    """Refresh JSON consumers used by congressNetWorth + investments APIs."""
    rows = list(trades)

    congress_path = ROOT / "src" / "data" / "congress-trading-all.json"
    congress_path.parent.mkdir(parents=True, exist_ok=True)
    congress_out = [
        {
            "BioGuideID": t["bioguide_id"],
            "Name": t["name"],
            "Traded": t["trade_date"].date().isoformat() if t["trade_date"] else None,
            "Filed": t["filing_date"].date().isoformat() if t["filing_date"] else None,
            "Transaction": t["transaction_label"],
            "Trade_Size_USD": t["amount_raw"],
            "Company": t["asset"],
            "Ticker": t["ticker"],
            "Chamber": t["chamber"].title() if t["chamber"] else None,
            "Party": t["party"],
            "State": t["state"],
            "TickerType": t["asset_type"],
            "Comments": t["comment"],
            "Subholding": t["owner"],
        }
        for t in rows
    ]
    with open(congress_path, "w", encoding="utf-8") as f:
        json.dump(congress_out, f)
    logger.info("Wrote %s rows -> %s", len(congress_out), congress_path)

    senate_path = ROOT / "public" / "data" / "senateTrades.json"
    senate_path.parent.mkdir(parents=True, exist_ok=True)
    senate_out = [
        {
            "senator": t["name"],
            "bioguideId": t["bioguide_id"],
            "ticker": t["ticker"],
            "asset": t["asset"],
            "assetType": t["asset_type"],
            "type": t["tx_type"],
            "buySell": t["buy_sell"],
            "transactionDate": t["trade_date"].date().isoformat() if t["trade_date"] else None,
            "reportDate": t["filing_date"].date().isoformat() if t["filing_date"] else None,
            "amountLow": t["amount_low"],
            "amountHigh": t["amount_high"],
            "amount": t["amount_raw"],
            "owner": t["owner"],
            "comment": t["comment"],
            "source": t["source"],
        }
        for t in rows
    ]
    with open(senate_path, "w", encoding="utf-8") as f:
        json.dump(senate_out, f)
    logger.info("Wrote %s rows -> %s", len(senate_out), senate_path)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    print(import_trading())
