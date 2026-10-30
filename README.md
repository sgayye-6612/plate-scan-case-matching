# PlateScan – Plate Scan & Case Matching Service

React + Vite + Motion frontend, FastAPI + PostgreSQL backend.

## Run it (Windows)
1. Make sure PostgreSQL is running and the database in `backend\.env` exists.
2. Double-click `1-start-backend.bat`  -> http://localhost:8000
3. Double-click `2-start-frontend.bat` -> http://localhost:5173
4. Optional: double-click `3-reset-demo-data.bat` for clean demo data.

Login: `agent_a` / `password123` (or `agent_b`).

## Structure
- `backend/app` – FastAPI app (routes, auth, models, seed)
- `frontend/src/App.jsx` – login, dashboard, API calls
- `frontend/src/components/StatCard.jsx` – animated dashboard cards
- `frontend/src/components/CasesTable.jsx` – search, filter, sort, claim
- `frontend/src/components/ScanTimeline.jsx` – scan history drawer
- `frontend/src/lib/format.js` – helpers
