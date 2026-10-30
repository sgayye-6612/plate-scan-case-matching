# Plate Scan – License Plate Case Matching System

Plate Scan is a full-stack application designed to process vehicle license plate scans, match vehicles against active cases, and support location-based case tracking and partner workflows.

## Application Screenshots

![Main Application](docs/screenshots/screen-1.png)
![Plate Scanning](docs/screenshots/screen-2.png)
![Case Matching](docs/screenshots/screen-3.png)

## Features

- License plate scan ingestion
- Vehicle identification and case matching
- VIN-based active case lookup
- Vehicle scan history and location tracking
- Partner eligibility verification
- Case claim workflow
- RESTful API integration

## Tech Stack

**Frontend:** React 19, Vite, Tailwind CSS 4, Motion

**Backend:** Python, FastAPI, Uvicorn

**Database:** PostgreSQL, SQLAlchemy

**API Documentation:** Swagger / OpenAPI

## Project Structure

```text
plate-scan-case-matching/
├── backend/
│   └── app/
├── frontend/
└── README.md
```

## Getting Started

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API documentation: http://127.0.0.1:8000/docs

### Frontend Setup

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: http://localhost:5173

## Author

**Sahithi Gayye**

AI Engineer | Full Stack Developer

[GitHub Profile](https://github.com/sgayye-6612)

---

*Developed using React, FastAPI, and PostgreSQL.*
