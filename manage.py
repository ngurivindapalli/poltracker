#!/usr/bin/env python3
"""
Politeia / PolTracker management CLI.

Usage:
  python manage.py update-data
  python manage.py import-trading [--path PATH]
  python manage.py import-contracts [--path PATH]
  python manage.py import-disclosures [--path PATH]
  python manage.py recalculate-summaries
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

# Ensure project root is on sys.path when invoked as `python manage.py ...`
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


def cmd_update_data(args: argparse.Namespace) -> int:
    from services.nightly_update import run_nightly_update

    result = run_nightly_update(
        trading_path=args.trading_path,
        contracts_path=args.contracts_path,
        disclosures_path=args.disclosures_path,
        skip_trading=args.skip_trading,
        skip_contracts=args.skip_contracts,
        skip_disclosures=args.skip_disclosures,
        skip_summaries=args.skip_summaries,
    )
    print(json.dumps(result, indent=2, default=str))
    return 0


def cmd_import_trading(args: argparse.Namespace) -> int:
    from services.import_trading import import_trading

    print(json.dumps(import_trading(args.path), indent=2, default=str))
    return 0


def cmd_import_contracts(args: argparse.Namespace) -> int:
    from services.import_contracts import import_contracts

    print(json.dumps(import_contracts(args.path), indent=2, default=str))
    return 0


def cmd_import_disclosures(args: argparse.Namespace) -> int:
    from services.import_disclosures import import_disclosures

    print(json.dumps(import_disclosures(args.path), indent=2, default=str))
    return 0


def cmd_recalculate(args: argparse.Namespace) -> int:
    from services.recalculate_summaries import recalculate_summaries

    print(json.dumps(recalculate_summaries(), indent=2, default=str))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Politeia data management CLI")
    parser.add_argument("-v", "--verbose", action="store_true")
    sub = parser.add_subparsers(dest="command", required=True)

    p_update = sub.add_parser(
        "update-data",
        help="Import trading + contracts + disclosures, then recalculate summaries",
    )
    p_update.add_argument("--trading-path", default=None)
    p_update.add_argument("--contracts-path", default=None)
    p_update.add_argument("--disclosures-path", default=None)
    p_update.add_argument("--skip-trading", action="store_true")
    p_update.add_argument("--skip-contracts", action="store_true")
    p_update.add_argument("--skip-disclosures", action="store_true")
    p_update.add_argument("--skip-summaries", action="store_true")
    p_update.set_defaults(func=cmd_update_data)

    p_trade = sub.add_parser("import-trading", help="Import congressional trades Excel")
    p_trade.add_argument("--path", default=None)
    p_trade.set_defaults(func=cmd_import_trading)

    p_contracts = sub.add_parser("import-contracts", help="Import contracts Excel")
    p_contracts.add_argument("--path", default=None)
    p_contracts.set_defaults(func=cmd_import_contracts)

    p_disc = sub.add_parser("import-disclosures", help="Import financial disclosures JSON")
    p_disc.add_argument("--path", default=None)
    p_disc.set_defaults(func=cmd_import_disclosures)

    p_sum = sub.add_parser("recalculate-summaries", help="Rebuild portfolio snapshots")
    p_sum.set_defaults(func=cmd_recalculate)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    _setup_logging(args.verbose)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
