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

2. Set up PostgreSQL database

   **Option A: Using Docker (Recommended)**
   
   ```bash
   docker run --name poltracker-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=poltracker -p 5432:5432 -d postgres:15
   ```

   **Option B: Using local PostgreSQL installation**
   
   Create a database named `poltracker` in your local PostgreSQL instance.

3. Create `.env.local` in the project root:

```bash
API_DATA_GOV_KEY=YOUR_40_CHAR_API_KEY
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/poltracker?schema=public"
```

   For local PostgreSQL, update the connection string with your username and password:
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/poltracker?schema=public"
```

4. Run database migrations

```bash
npm run db:migrate
```

   This will create all necessary tables and generate the Prisma client.

5. (Optional) Seed the database with sample data

```bash
npm run db:seed
```

6. Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## API Routes

- `GET /api/senators` — list senators (filtered from current members)
- `GET /api/senator/[bioguideId]` — member details
- `GET /api/senator/[bioguideId]/sponsored-bills` — sponsored legislation
- `GET /api/senator/[bioguideId]/cosponsored-bills` — cosponsored legislation
- `GET /api/senators/[bioguideId]/connections` — get senator connections (family, government, business, NGO)
- `POST /api/senators/[bioguideId]/enrich` — enrich senator connections from Wikidata (dev mode only)

## Senator Connections Feature

The app includes a comprehensive "Connections Web" feature that maps relationships between senators and other entities (people and organizations). Connections are categorized into:

- **Family**: Spouse, children, parents, siblings
- **Government**: Government positions, agencies, offices
- **Business**: Employers, board memberships, corporate affiliations
- **NGO & Influence**: Non-profit organizations, foundations, think tanks

### Using the Connections Feature

1. Navigate to any senator's detail page
2. Scroll to the "Connections" section
3. Use the tabs to filter by category
4. Toggle between "List View" and "Graph View" to visualize connections
5. Click "View Sources" on any connection to see citations and evidence

### Enriching Connections (Development Mode)

In development mode, you'll see an "Enrich Connections" button on senator pages. Clicking it will:

1. Resolve the senator's Bioguide ID to a Wikidata QID
2. Query Wikidata SPARQL endpoint for family, government, business, and NGO connections
3. Store entities, edges, and sources in the database
4. Compute confidence and importance scores for each relationship

**Note**: Enrichment is rate-limited and cached (24-hour cooldown per senator) to avoid hammering Wikidata's API.

## Database Schema

The app uses PostgreSQL with Prisma ORM. Key models:

- **Entity**: People and organizations (with external IDs like Bioguide, Wikidata QID)
- **Edge**: Relationships between entities (with category, relationship type, confidence/importance scores)
- **Source**: Citations and evidence for connections
- **SenatorProfile**: Mapping between senators and entities

## Notes / Next Improvements

- The Congress.gov API returns rich data (committees, terms, addresses, social, etc.). You can surface more fields from `GET /api/senator/[bioguideId]`.
- Add pagination and sorting for bills.
- Add a "Related documents" panel using the **GovInfo API** if you want PDFs, bill text, and package metadata.
