# Plate Scan – License Plate Case Matching System

Plate Scan is a full-stack application designed to process vehicle license plate scans, match vehicles against active cases, and support location-based case tracking and partner workflows.
<img width="951" height="1093" alt="Screenshot 2026-10-30 155355" src="https://github.com/user-attachments/assets/6ca6df50-5118-46ae-b99b-41cb2686b4e2" />
<img width="1887" height="1104" alt="Screenshot 2026-10-30 155337" src="https://github.com/user-attachments/assets/ebb328fb-a146-484a-abfd-7e4a5e925e4f" />
<img width="1493" height="730" alt="Screenshot 2026-10-30 155331" src="https://github.com/user-attachments/assets/40722be6-2dee-45b7-88e5-3d2f394c3f81" />


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
