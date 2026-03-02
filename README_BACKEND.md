# Real Tweet Scraper Setup

This project includes a FastAPI backend for scraping real tweets from US senators.

## Quick Start

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start FastAPI Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

The backend will run at `http://localhost:8000`

### 3. Start Next.js Frontend

In a separate terminal:

```bash
npm run dev
```

The frontend will run at `http://localhost:3000`

## How It Works

1. **Tweet Scraper** (`backend/services/tweet_scraper.py`)
   - Searches Bing for senator's Twitter posts
   - Extracts tweet-like content from search results
   - Returns up to 5 recent tweets

2. **FastAPI Backend** (`backend/main.py`)
   - Provides REST API endpoint: `GET /api/tweets/{name}`
   - Handles CORS for Next.js frontend
   - Returns JSON with tweet data

3. **Next.js API Route** (`src/app/api/senator/[bioguideId]/tweets/route.ts`)
   - Proxies requests from frontend to FastAPI backend
   - Fetches senator name from bioguideId
   - Returns tweets or empty array on error

4. **React Component** (`src/components/senator/RealTweets.tsx`)
   - Displays tweets in a responsive grid
   - Shows up to 5 tweets per senator
   - Falls back gracefully if no tweets found

## Environment Variables

Optional environment variables:

- `FASTAPI_BACKEND_URL` - Backend URL (default: `http://localhost:8000`)
- `NEXT_PUBLIC_BASE_URL` - Frontend URL (default: `http://localhost:3000`)

## Testing

Visit any senator page (e.g., `/senator/S000033`) to see real tweets displayed in the "Latest posts from [Name]" section.

## Notes

- No X/Twitter API key required
- Uses Bing search (Google blocks bots)
- Results are not cached by default (add caching if needed)
- Demo-safe: Returns empty array on errors instead of crashing
