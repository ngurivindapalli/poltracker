# PolTracker Gov

A simple full-stack Next.js app that lets you:

- Browse **current U.S. Senators** with **photos**
- Search by name / state / party
- Open a senator page and view **recent sponsored and cosponsored legislation**

## Data Sources

- **Congress.gov API** (served at `https://api.congress.gov/v3`) — requires an `api.data.gov` key. 
- Senator photos use predictable public domain URLs by Bioguide ID (`https://unitedstates.github.io/images/congress/[size]/[bioguide].jpg`).

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Create `.env.local` in the project root:

```bash
API_DATA_GOV_KEY=YOUR_40_CHAR_API_KEY
```

3. Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## API Routes

- `GET /api/senators` — list senators (filtered from current members)
- `GET /api/senator/[bioguideId]` — member details
- `GET /api/senator/[bioguideId]/sponsored-bills` — sponsored legislation
- `GET /api/senator/[bioguideId]/cosponsored-bills` — cosponsored legislation

## Notes / Next Improvements

- The Congress.gov API returns rich data (committees, terms, addresses, social, etc.). You can surface more fields from `GET /api/senator/[bioguideId]`.
- Add pagination and sorting for bills.
- Add a "Related documents" panel using the **GovInfo API** if you want PDFs, bill text, and package metadata.
