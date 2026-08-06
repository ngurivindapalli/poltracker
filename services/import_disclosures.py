"""
Import annual financial disclosures from existing local datasets into the DB.

Sources (first found wins for holdings richness):
  - public/data/investments.json
  - data/investments.json
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from services.db import ROOT, session_scope
from services.models import AnnualDisclosure, AssetLine, Member
from services.normalize import clean_str

logger = logging.getLogger(__name__)

DEFAULT_PATHS = [
    ROOT / "public" / "data" / "investments.json",
    ROOT / "data" / "investments.json",
]


def resolve_disclosures_path(path: Optional[str | Path] = None) -> Path:
    if path:
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Disclosures JSON not found: {p}")
        return p
    for candidate in DEFAULT_PATHS:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(
        "No investments/disclosures JSON found under public/data or data/."
    )


def _parse_range(value: Any) -> Tuple[Optional[int], Optional[int]]:
    if value is None:
        return None, None
    if isinstance(value, dict):
        lo = value.get("min") if value.get("min") is not None else value.get("low")
        hi = value.get("max") if value.get("max") is not None else value.get("high")
        try:
            return (
                int(float(lo)) if lo is not None else None,
                int(float(hi)) if hi is not None else None,
            )
        except (TypeError, ValueError):
            return None, None
    s = clean_str(value)
    if not s:
        return None, None
    nums = re.findall(r"[\d,]+(?:\.\d+)?", s.replace("$", ""))
    if not nums:
        return None, None
    try:
        if len(nums) == 1:
            n = int(float(nums[0].replace(",", "")))
            return n, n
        return int(float(nums[0].replace(",", ""))), int(float(nums[1].replace(",", "")))
    except ValueError:
        return None, None


def _ensure_member(session: Session, bioguide_id: str) -> Optional[Member]:
    return session.get(Member, bioguide_id)


def import_disclosures(path: Optional[str | Path] = None) -> Dict[str, int]:
    json_path = resolve_disclosures_path(path)
    logger.info("Reading disclosures from %s", json_path)
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Expected shapes:
    # { "US": { "B000944": [ {description, estimated_value_range, ...}, ... ] } }
    # or { "B000944": [ ... ] }
    if isinstance(data, dict) and "US" in data and isinstance(data["US"], dict):
        by_member = data["US"]
    elif isinstance(data, dict):
        by_member = {k: v for k, v in data.items() if isinstance(v, list)}
    else:
        raise ValueError("Unexpected disclosures JSON structure")

    stats = {
        "members_with_holdings": 0,
        "disclosures_upserted": 0,
        "assets_upserted": 0,
        "skipped_unknown_member": 0,
    }
    year = datetime.utcnow().year
    now = datetime.utcnow()

    with session_scope() as session:
        for bioguide_id, holdings in by_member.items():
            if not isinstance(holdings, list) or not holdings:
                continue
            bid = str(bioguide_id).upper()
            member = _ensure_member(session, bid)
            if not member:
                stats["skipped_unknown_member"] += 1
                continue

            stats["members_with_holdings"] += 1
            source_url = f"local://investments/{bid}/{year}"

            disclosure = session.execute(
                select(AnnualDisclosure).where(
                    AnnualDisclosure.bioguide_id == bid,
                    AnnualDisclosure.year == year,
                    AnnualDisclosure.source_url == source_url,
                )
            ).scalar_one_or_none()

            if not disclosure:
                disclosure = AnnualDisclosure(
                    id=str(uuid.uuid4()),
                    bioguide_id=bid,
                    year=year,
                    filing_type="annual",
                    source_url=source_url,
                    raw_file_ref=str(json_path.name),
                    created_at=now,
                )
                session.add(disclosure)
                session.flush()
                stats["disclosures_upserted"] += 1
            else:
                # Replace asset lines for this disclosure to avoid dupes
                session.execute(
                    delete(AssetLine).where(AssetLine.disclosure_id == disclosure.id)
                )
                session.flush()

            for h in holdings:
                if not isinstance(h, dict):
                    continue
                desc = (
                    clean_str(h.get("description") or h.get("asset") or h.get("name"))
                    or "Holding"
                )
                rng = h.get("estimated_value_range") or h.get("amount") or h.get("value")
                lo, hi = _parse_range(rng)
                income_type = clean_str(h.get("income_type") or h.get("type"))
                session.add(
                    AssetLine(
                        id=str(uuid.uuid4()),
                        disclosure_id=disclosure.id,
                        description=desc[:2000],
                        value_low=lo,
                        value_high=hi,
                        income_type=income_type,
                    )
                )
                stats["assets_upserted"] += 1

        session.commit()

    logger.info("Disclosures import complete: %s", stats)
    return stats


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    print(import_disclosures())
