# Quiver Hobbyist capability report

Generated as part of the Politeia Quiver integration audit (Aug 2026).

## Capability matrix

| Dataset | Hobbyist | Politeia | Status | Action |
|--------|----------|----------|--------|--------|
| Congressional Trading | YES | YES | Sync + profile UI | Improved deduped financial-profile fetch |
| Politician Net Worth | YES | YES | Sync + StatCards / FinancialOverview | Single net-worth on senator pages (StatCards only) |
| Corporate PAC Donors | YES | YES | Sync + CorporateDonorsTable | Wired to financial-profile API |
| Government Contracts | YES | YES | Sync + GovernmentContracts | Ticker-linked fallback in financial-profile |
| Corporate Lobbying | YES | YES | Sync + CompanyMarketSignals | Unchanged |
| Donald Trump Stock Trades | YES | YES | Sync + `/trump-trades` + global profile | Stats API + compact panel on `/global/donald-trump` |
| Off-Exchange Trading | YES | YES | Sync + CompanyMarketSignals | Unchanged |
| Congress Stock Holdings | YES (live) | YES | New sync + CongressHoldings UI | Run `npm run sync:quiver:holdings` |
| Political Exposure | YES (pricing) | NO | REST 404 on probed paths | Wait for documented endpoint |
| Congressional Legislation | YES (pricing) | Partial | Congress.gov primary | Do not duplicate bill records |
| SEC insider / 13F / etc. | NO | NO | N/A | Not attempted |

## Already implemented

- Central client: `src/lib/quiver/client.ts`, `endpoints.ts`, `types.ts`, `normalizers.ts`
- Nightly GitHub Action sync + local JSON cache under `data/quiver/`
- Senator/representative financial sections (trades, donors, contracts, lobbying, off-exchange)
- Trump trades page and cache (200 rows in last sync)
- Investments leaderboard from precomputed summaries
- Server-only API key; no browser exposure found

## Added in this pass

- Congress holdings sync (`src/services/quiver/congressHoldings.ts`)
- `CongressHoldings` component (estimated ticker values)
- `CorporateDonorsTable` with Company/PAC/Amount/Date/Cycle columns
- `TrumpTradesPanel` summary stats via `/api/trump-trades`
- Trump trading section on `/global/donald-trump`
- Financial-profile bundle: holdings, deduped trade history, contract-by-ticker fallback
- `Most traded tickers` section (replaces misleading “holdings unavailable” copy)
- Search entries for Donald Trump profile
- Licensing note in docs

## Not implemented

| Item | Reason |
|------|--------|
| Political Exposure | No working REST endpoint found (404) |
| Quiver Legislation UI | No working REST endpoint; Congress.gov retained |
| Trader-tier datasets | Not on Hobbyist plan |

## Fixed

- Duplicate net worth on senator pages (removed redundant `FinancialOverview` card)
- Duplicate net worth chart on representative pages (removed `EstimatedNetWorthChart`)
- Mislabeled `LobbyingTable` usage for donors (replaced with `CorporateDonorsTable`)
- Financial-profile double fetch of trades (50 + 5000 → single 2000 history pass)
- Misleading `LargestHoldings` empty state (now shows most-traded tickers)

## API endpoints (server-side)

All under `https://api.quiverquant.com/beta` with `Authorization: Bearer QUIVER_API_KEY`:

- `/live/congresstrading`, `/bulk/congresstrading`
- `/bulk/congress/politicians`
- `/bulk/corporatedonors`
- `/live/govcontractsall`
- `/live/lobbying`
- `/live/offexchange`
- `/bulk/trumpstocktrades`
- `/live/congressholdings`

Politeia routes:

- `GET /api/member/[bioguideId]/financial-profile`
- `GET /api/trump-trades`

## Environment variables

- `QUIVER_API_KEY` (required, server only)
- `QUIVER_BASE_URL` (optional, default beta base)
- `DATABASE_URL` (optional, Prisma warehouse)
- `QUIVER_TRADES_MAX_PAGES`, `QUIVER_TRADES_PAGE_SIZE`, etc. (optional sync caps)

## Performance

- Profile components share one financial-profile request where possible
- Historical Quiver data served from JSON cache (no live API on page views)
- GitHub Action uses reduced trade page cap; full sync available locally

## Licensing

**Quiver Hobbyist currently has no commercial use rights** per
[Quiver pricing](https://api.quiverquant.com/pricing/). Politeia attributes
Quiver as the data source and uses “Estimated” / “Reported” language. **Review
licensing with Quiver before any commercial or monetized public deployment.**
