# OriginX Frontend

React + Vite frontend for OriginX.

It consumes backend APIs for verification, analysis, trending news, and real-time dashboard/history data.

## Stack

- React 18
- React Router
- Vite 6
- Tailwind CSS 4
- Motion + Lucide UI components

## Prerequisites

- Node.js 18+ (20 LTS recommended)
- npm 9+

## Environment

Create `frontend/.env` (or `.env.local`) with:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

If omitted, frontend falls back to `http://127.0.0.1:8000`.

## Run

```bash
cd frontend
npm install
npm run dev
```

Default local app URL: `http://localhost:5173`

## Scripts

- `npm run dev` - start development server
- `npm run build` - build production assets into `dist/`

## Routes

- `/` - Landing page
- `/dashboard` - Real-time overview (database-backed)
- `/verify` - Claim verification
- `/verify-image` - Alias route to verify page
- `/history` - Real-time verification history (database-backed)
- `/url-investigation` - URL/domain + propagation investigation
- `/trending` - Trusted-source trending news
- `/settings` - Settings page

## Real-Time Behavior

- Dashboard
  - Polls backend summary endpoint.
  - Updates cards, recent verifications, and trending topics automatically.

- History
  - Polls backend history endpoint.
  - Updates table and summary metrics automatically.

- Trending News
  - Polls backend every 30 minutes.
  - Country/category aware and trusted-source filtered.

## API Integration

Frontend service layer is in:

- `src/app/services/api.ts`

Important endpoints used by UI:

- `POST /verify-claim`
- `GET /dashboard/summary`
- `GET /history/verifications`
- `POST /analysis/domain-security`
- `POST /analysis/reddit-propagation`
- `GET /analysis/trending-news`

## Build

```bash
npm run build
```

Output directory:

- `frontend/dist/`

## Attribution

See `ATTRIBUTIONS.md` for design and third-party attribution.
