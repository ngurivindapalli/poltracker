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
# Full sync (all 7 datasets)
npm run sync:quiver

# Per dataset
npm run sync:quiver:trades
npm run sync:quiver:networth
npm run sync:quiver:donors
npm run sync:quiver:contracts
npm run sync:quiver:lobbying
npm run sync:quiver:offexchange
npm run sync:quiver:trump

# Validate cache (duplicates, dates)
npm run validate:quiver

# Unit tests (mocked — does not call Quiver)
npm run test:quiver
```

Optional page caps:

```bash
QUIVER_TRADES_MAX_PAGES=40
QUIVER_DONORS_MAX_PAGES=50
```

## Runtime architecture

- Sync jobs write **JSON cache** under `data/quiver/` (always) and optionally
  Postgres via Prisma when `DATABASE_URL` is available.
- Next.js profile/API routes **read the Quiver cache only** (no legacy Excel SoT).
- Failed or empty API responses **do not overwrite** existing cache/DB rows.

## Rollback

1. Stop scheduled `sync:quiver` jobs.  
2. Restore previous `data/quiver/*` from backup (or git history).  
3. Restore Postgres dump if DB mode was used.  
4. Legacy tables (`ptr_*`, etc.) remain in schema but are not queried.

## Cron

GitHub Action: `.github/workflows/quiver-sync.yml` (nightly + manual dispatch).
Requires secrets: `QUIVER_API_KEY`, optional `DATABASE_URL`.

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

Auth header: `Authorization: Bearer <QUIVER_API_KEY>`
