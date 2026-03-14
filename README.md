# OriginX

OriginX is a full-stack misinformation analysis platform with a FastAPI backend and a React + Vite frontend.

It includes:

- Claim verification with evidence-backed scoring.
- URL/domain risk and propagation analysis.
- Trusted-source trending news aggregation.
- Real-time dashboard and history views backed by Supabase records.

## Architecture

- `backend/`: FastAPI API server, services, Supabase integration, tests.
- `frontend/`: React UI with route-based pages and API service layer.
- `backend/sql/init_supabase.sql`: schema + policies for `claims` and `verification_history`.

## Prerequisites

- Python 3.11+
- Node.js 18+ (20 LTS recommended)
- npm 9+
- Supabase project (URL + anon key)

## Quick Start

### 1) Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env` from `backend/.env.example` and set required values:

- `SUPABASE_URL`
- `SUPABASE_KEY`

Recommended for local frontend integration:

- `BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`

Run backend:

```bash
uvicorn app.main:app --reload
```

Backend base URL: `http://127.0.0.1:8000`

### 2) Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env` (or `.env.local`) and set:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Run frontend:

```bash
npm run dev
```

Frontend URL (default): `http://localhost:5173`

## Real-Time Product Behavior

- Dashboard (`/dashboard`)
  - Uses database-backed summary endpoint.
  - Auto-refreshes every 30 seconds.
  - Trending Topics are derived from live trending news topics.

- History (`/history`)
  - Reads latest verification records from database.
  - Auto-refreshes every 30 seconds.
  - Supports search, status filter, and sorting on live records.

- Verify Claim (`/verify`)
  - Calls backend verification API.
  - Persists generated verification into `verification_history`.

- URL Investigation (`/url-investigation`)
  - Uses domain-security and Reddit propagation APIs.
  - Refreshes analysis view periodically on the page.

- Trending News (`/trending`)
  - Uses trusted-source RSS aggregation.
  - Country/category aware.
  - Auto-refreshes every 30 minutes.

## Core API Endpoints

- `GET /health`
- `POST /verify-claim`
- `POST /verify-claim/final`
- `GET /dashboard/summary`
- `GET /history/verifications`
- `POST /analysis/domain-security`
- `POST /analysis/reddit-propagation`
- `GET /analysis/trending-news`

## Database Setup

Run the SQL script below in Supabase SQL Editor:

- `backend/sql/init_supabase.sql`

## Testing

Backend tests:

```bash
cd backend
pytest -q
```

Frontend production build:

```bash
cd frontend
npm run build
```

## API Documentation

When backend is running:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
