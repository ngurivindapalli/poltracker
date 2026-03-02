# PolTracker Backend API

FastAPI backend for PolTracker Gov.

## Setup

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Run the FastAPI server:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /api/tweets/{name}` - Get recent tweets for a senator by name

## Environment Variables

- `FASTAPI_BACKEND_URL` - Backend URL (default: `http://localhost:8000`)

## Notes

- The tweet scraper uses Bing search to find recent tweets
- Results are cached for performance
- No X/Twitter API key required
