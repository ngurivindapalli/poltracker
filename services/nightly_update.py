"""Nightly data pipeline: trades → contracts → disclosures → summaries."""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def run_nightly_update(
    *,
    trading_path: Optional[str] = None,
    contracts_path: Optional[str] = None,
    disclosures_path: Optional[str] = None,
    skip_trading: bool = False,
    skip_contracts: bool = False,
    skip_disclosures: bool = False,
    skip_summaries: bool = False,
) -> Dict[str, Any]:
    """
    Run full update sequence:

      1. Update congressional trades
      2. Update contracts
      3. Update financial disclosures
      4. Recalculate summaries
    """
    results: Dict[str, Any] = {}
    started = time.time()

    if not skip_trading:
        logger.info("=== 1/4 Congressional trades ===")
        from services.import_trading import import_trading

        results["trading"] = import_trading(trading_path)
    else:
        logger.info("=== 1/4 Congressional trades (skipped) ===")
        results["trading"] = {"skipped": True}

    if not skip_contracts:
        logger.info("=== 2/4 Government contracts ===")
        from services.import_contracts import import_contracts

        results["contracts"] = import_contracts(contracts_path)
    else:
        logger.info("=== 2/4 Government contracts (skipped) ===")
        results["contracts"] = {"skipped": True}

    if not skip_disclosures:
        logger.info("=== 3/4 Financial disclosures ===")
        from services.import_disclosures import import_disclosures

        try:
            results["disclosures"] = import_disclosures(disclosures_path)
        except FileNotFoundError as e:
            logger.warning("Disclosures skipped: %s", e)
            results["disclosures"] = {"skipped": True, "reason": str(e)}
    else:
        logger.info("=== 3/4 Financial disclosures (skipped) ===")
        results["disclosures"] = {"skipped": True}

    if not skip_summaries:
        logger.info("=== 4/4 Recalculate summaries ===")
        from services.recalculate_summaries import recalculate_summaries

        results["summaries"] = recalculate_summaries()
    else:
        logger.info("=== 4/4 Recalculate summaries (skipped) ===")
        results["summaries"] = {"skipped": True}

    results["elapsed_seconds"] = round(time.time() - started, 2)
    logger.info("Nightly update finished in %ss", results["elapsed_seconds"])
    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    print(run_nightly_update())
