"""
Import recent federal contracts Excel into government_contracts.

Dataset columns (auto-detected): Ticker, Date, Description, Agency, Amount.
Politicians are linked later via tickers they have traded (see API routes).
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from services.db import ROOT, session_scope
from services.models import GovernmentContract
from services.normalize import (
    clean_str,
    fingerprint,
    parse_amount_float,
    parse_date,
)

logger = logging.getLogger(__name__)

DEFAULT_PATHS = [
    ROOT / "data" / "imports" / "contracts-recent.xlsx",
    Path.home() / "Downloads" / "contracts-recent.xlsx",
]

SOURCE_LABEL = "contracts-recent"


def resolve_contracts_path(path: Optional[str | Path] = None) -> Path:
    if path:
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Contracts Excel not found: {p}")
        return p
    for candidate in DEFAULT_PATHS:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(
        "Contracts Excel not found. Place contracts-recent.xlsx under data/imports/ "
        "or pass --path."
    )


def _row_get(row: pd.Series, *names: str) -> Any:
    for name in names:
        if name in row.index and pd.notna(row[name]):
            return row[name]
        for col in row.index:
            if str(col).lower() == name.lower() and pd.notna(row[col]):
                return row[col]
    return None


def normalize_contract_row(row: pd.Series) -> Optional[Dict[str, Any]]:
    ticker = clean_str(_row_get(row, "Ticker", "ticker", "Symbol", "symbol"))
    if not ticker:
        return None
    ticker = ticker.upper()

    award_date = parse_date(
        _row_get(row, "Date", "date", "AwardDate", "award_date", "Award Date")
    )
    description = clean_str(
        _row_get(row, "Description", "description", "desc", "Title")
    )
    agency = clean_str(_row_get(row, "Agency", "agency", "Department", "department"))
    amount = parse_amount_float(
        _row_get(row, "Amount", "amount", "Value", "value", "ContractValue")
    )
    status = clean_str(_row_get(row, "Status", "status")) or "active"
    vendor = clean_str(
        _row_get(row, "Vendor", "vendor", "Company", "company", "Recipient")
    ) or ticker

    fp = fingerprint(
        ticker,
        award_date.date().isoformat() if award_date else "",
        agency,
        description,
        amount,
        vendor,
    )

    return {
        "ticker": ticker,
        "vendor": vendor,
        "agency": agency,
        "award_date": award_date,
        "description": description,
        "amount": amount,
        "status": status,
        "source": SOURCE_LABEL,
        "fingerprint": fp,
    }


def import_contracts(
    path: Optional[str | Path] = None,
    *,
    batch_size: int = 500,
    write_json: bool = True,
) -> Dict[str, int]:
    excel_path = resolve_contracts_path(path)
    logger.info("Reading contracts workbook: %s", excel_path)
    df = pd.read_excel(excel_path, engine="openpyxl")
    logger.info("Loaded %s contract rows, columns=%s", len(df), list(df.columns))

    normalized: List[Dict[str, Any]] = []
    seen: set[str] = set()
    skipped = 0
    for _, row in df.iterrows():
        c = normalize_contract_row(row)
        if not c:
            skipped += 1
            continue
        if c["fingerprint"] in seen:
            skipped += 1
            continue
        seen.add(c["fingerprint"])
        normalized.append(c)

    logger.info(
        "Normalized %s unique contracts (skipped %s)",
        len(normalized),
        skipped,
    )

    stats = {
        "rows_read": int(len(df)),
        "rows_normalized": len(normalized),
        "inserted": 0,
        "existing": 0,
        "skipped": skipped,
    }

    now = datetime.utcnow()
    with session_scope() as session:
        existing = set(
            session.execute(select(GovernmentContract.fingerprint)).scalars().all()
        )
        buffer: List[Dict[str, Any]] = []
        for c in normalized:
            if c["fingerprint"] in existing:
                stats["existing"] += 1
                continue
            buffer.append(
                {
                    "id": str(uuid.uuid4()),
                    "ticker": c["ticker"],
                    "vendor": c["vendor"],
                    "agency": c["agency"],
                    "award_date": c["award_date"],
                    "description": (c["description"] or "")[:8000] or None,
                    "amount": c["amount"],
                    "status": c["status"],
                    "source": c["source"],
                    "fingerprint": c["fingerprint"],
                    "created_at": now,
                    "updated_at": now,
                }
            )
            existing.add(c["fingerprint"])
            if len(buffer) >= batch_size:
                _flush(session, buffer)
                stats["inserted"] += len(buffer)
                logger.info("Inserted contracts batch (total new ~%s)", stats["inserted"])
                buffer = []
                session.commit()
        if buffer:
            _flush(session, buffer)
            stats["inserted"] += len(buffer)
            session.commit()

    if write_json:
        out_path = ROOT / "public" / "data" / "contracts-recent.json"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        payload = [
            {
                "ticker": c["ticker"],
                "vendor": c["vendor"],
                "agency": c["agency"],
                "awardDate": c["award_date"].date().isoformat() if c["award_date"] else None,
                "description": c["description"],
                "amount": c["amount"],
                "status": c["status"],
                "source": c["source"],
            }
            for c in normalized
        ]
        import json

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(payload, f)
        logger.info("Wrote %s contracts -> %s", len(payload), out_path)

    logger.info("Contracts import complete: %s", stats)
    return stats


def _flush(session, rows: List[Dict[str, Any]]) -> None:
    if not rows:
        return
    stmt = pg_insert(GovernmentContract.__table__).values(rows)
    stmt = stmt.on_conflict_do_nothing(index_elements=["fingerprint"])
    session.execute(stmt)
    session.flush()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    print(import_contracts())
