# OriginX

OriginX is a misinformation analysis backend built with FastAPI.

## Project Structure

- `backend/`: FastAPI application, services, tests, and SQL setup scripts.
- `backend/app/`: API routes, business logic, and configuration.
- `backend/sql/`: Supabase schema and policy setup.
- `backend/tests/`: Automated test suite.

## Prerequisites

- Python 3.11+
- A virtual environment (recommended)
- Supabase project credentials (for database-backed features)

## Quick Start

1. Move to the backend folder:

```bash
cd backend
```

2. Create and activate a virtual environment:

```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Configure environment variables:

- Copy values from `.env.example` into `.env`.
- Set required keys like `SUPABASE_URL` and `SUPABASE_KEY`.

5. Run the API:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## Health Check

```text
GET http://127.0.0.1:8000/health
```

Expected response:

```json
{
  "status": "OriginX backend running"
}
```

## Database Setup (Supabase)

Run the SQL script in Supabase SQL Editor:

- `backend/sql/init_supabase.sql`

Additional SQL setup notes are available in:

- `backend/sql/README.md`

## Running Tests

From `backend/`:

```bash
pytest -q
```

## API Docs

When the server is running:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
