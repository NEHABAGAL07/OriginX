# OriginX Backend

FastAPI backend for OriginX. It powers claim verification, security analysis, trending news, and real-time dashboard/history data from Supabase.

## Tech Stack

- FastAPI + Uvicorn
- Supabase (REST path and optional direct PostgreSQL path)
- Requests + service-layer API integrations

## Setup

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Run server:

```bash
uvicorn app.main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

## Environment Variables

Create `backend/.env` from `backend/.env.example`.

Required:

- `SUPABASE_URL`
- `SUPABASE_KEY`

Common optional:

- `BACKEND_CORS_ORIGINS` (comma-separated list)
- `NEWSAPI_KEY`
- `GOOGLE_AI_STUDIO_API_KEY`
- `GEMINI_MODEL`
- `VIRUSTOTAL_API_KEY`
- `OPENPHISH_FEED_URL`
- `REDDIT_USER_AGENT`

Optional direct PostgreSQL mode:

- `SUPABASE_USE_DIRECT_DB=true`
- `SUPABASE_DIRECT_DB_URL=postgresql://...`

Notes:

- If `SUPABASE_USE_DIRECT_DB` is not `true`, backend uses Supabase REST path.
- URL-encode special characters in DB password for direct connection URI.

## Database Schema (Supabase)

Run this script in Supabase SQL Editor:

- `backend/sql/init_supabase.sql`

It creates:

- `public.claims`
- `public.verification_history`
- required RLS policies for anon insert/select

## Main Endpoints

Health:

- `GET /health`

Claims:

- `POST /verify-claim`
- `POST /verify-claim/final`
- `GET /dashboard/summary`
- `GET /history/verifications`

Analysis:

- `POST /analysis/domain-security`
- `POST /analysis/reddit-propagation`
- `POST /analysis/propagation`
- `GET /analysis/trending-news`

Database utility:

- `GET /test-db/status`
- `POST /test-db`
- `GET /test-db/history`

## Real-Time Data Endpoints

- `GET /dashboard/summary`
  - Aggregates totals, changes, recent records, and trending topics.
  - Used by frontend dashboard polling.

- `GET /history/verifications`
  - Returns latest verification rows with derived fields.
  - Used by frontend history polling.

## Quick Validation

1. Backend health:

```text
GET http://127.0.0.1:8000/health
```

2. Supabase connectivity:

```text
GET http://127.0.0.1:8000/test-db/status
```

3. API docs:

- Swagger: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Tests

```bash
cd backend
pytest -q
```
