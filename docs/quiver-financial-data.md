# Quiver Quantitative financial data

## Overview

Quiver is the **primary source of truth** for Politeia financial datasets
(Hobbyist plan):

1. Congress trading  
2. Politician net worth  
3. Corporate donors  
4. Government contracts (company/ticker)  
5. Corporate lobbying (company/ticker)  
6. Off-exchange trading (company/ticker)  
7. Donald Trump stock trades (`GET /beta/bulk/trumpstocktrades`)  
8. Congress stock holdings (`GET /beta/live/congressholdings`)

## Licensing (Hobbyist)

Quiver’s Hobbyist tier states **no commercial use rights**. Politeia:

- Does **not** claim commercial redistribution rights for Quiver data.
- Keeps all Quiver API calls **server-side** (`QUIVER_API_KEY` never in the browser).
- Labels Quiver-derived figures as **estimated** or **reported** where appropriate.

**If Politeia is monetized or used commercially, verify licensing with Quiver
before public redistribution.**

## Environment

Copy `.env.example` → `.env.local` and set:

```bash
QUIVER_API_KEY=PASTE_YOUR_QUIVER_ACCESS_KEY_HERE
QUIVER_BASE_URL=https://api.quiverquant.com/beta
DATABASE_URL=postgresql://...   # optional warehouse for sync upserts
```

**Never commit real API keys.** `.env.local` is gitignored.

## Commands

```bash
# Full sync (all datasets including holdings)
npm run sync:quiver

# Per dataset
npm run sync:quiver:trades
npm run sync:quiver:networth
npm run sync:quiver:donors
npm run sync:quiver:contracts
npm run sync:quiver:lobbying
npm run sync:quiver:offexchange
npm run sync:quiver:trump
npm run sync:quiver:holdings

# Validate cache (duplicates, dates)
npm run validate:quiver

# Unit tests (mocked — does not call Quiver)
npm run test:quiver
```

Optional page caps:

```bash
# Full bulk trades is ~115k rows (~23 pages @ 5k). Booker's older trades are near the end.
QUIVER_TRADES_MAX_PAGES=80
QUIVER_TRADES_PAGE_SIZE=5000
QUIVER_TRADES_PAGE_DELAY_MS=300
QUIVER_NETWORTH_MAX_PAGES=50
QUIVER_DONORS_MAX_PAGES=50
```

Debug a politician (BioGuideID):

```bash
npm run debug:quiver:politician -- B001288
```

## Runtime architecture

- Sync jobs write **JSON cache** under `data/quiver/` (always) and optionally
  Postgres via Prisma when `DATABASE_URL` is available.
- Next.js profile/API routes **read the Quiver cache only** (no legacy Excel SoT).
- Failed or empty API responses **do not overwrite** existing cache/DB rows.
- Profile UI reads `/api/member/[bioguideId]/financial-profile` (single bundle).

## Not on Hobbyist / no working REST path

These were probed and are **not** implemented:

| Dataset | Status |
|--------|--------|
| Political Exposure | 404 on tested REST paths |
| Quiver Legislation | 404 — use **Congress.gov** for bills |
| SEC insider / 13F / patents / exec comp / newsfeed | Not on Hobbyist tier |

## Rollback

1. Stop scheduled `sync:quiver` jobs.  
2. Restore previous `data/quiver/*` from backup (or git history).  
3. Restore Postgres dump if DB mode was used.  
4. Legacy tables (`ptr_*`, etc.) remain in schema but are not queried.

## Cron

GitHub Action: `.github/workflows/quiver-sync.yml` (nightly + manual dispatch).
Requires secrets: `QUIVER_API_KEY`, optional `DATABASE_URL`.

Note: CI sets `QUIVER_TRADES_MAX_PAGES=20`, which may sync fewer trade rows
than a full local run. Increase for complete history if needed.

## Migration / Prisma

```bash
npx prisma generate
npx prisma migrate deploy
```

Schema migration: `prisma/migrations/20260811170000_quiver_financial_sot/`

## Endpoints used

| Dataset | Path |
|--------|------|
| Live trades | `/beta/live/congresstrading` |
| Bulk trades | `/beta/bulk/congresstrading` |
| Politicians NW | `/beta/bulk/congress/politicians` |
| Donors | `/beta/bulk/corporatedonors` |
| Contracts live | `/beta/live/govcontractsall` |
| Lobbying live | `/beta/live/lobbying` |
| Off-exchange live | `/beta/live/offexchange` |
| Trump trades | `/beta/bulk/trumpstocktrades` |
| Congress holdings | `/beta/live/congressholdings` |

Auth header: `Authorization: Bearer <QUIVER_API_KEY>`

## UI routes

| Route | Quiver data |
|-------|-------------|
| `/senator/[id]` | Net worth, trades, holdings, donors, contracts, lobbying, off-exchange |
| `/representatives/[id]` | Same financial sections |
| `/trump-trades` | Donald Trump stock trades |
| `/global/donald-trump` | Trump profile + compact trading panel |
| `/investments` | Precomputed senator summaries |

See also: `docs/quiver-capability-report.md`
