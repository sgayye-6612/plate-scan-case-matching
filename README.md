# License Plate Scan & Case Matching Service

A backend service that processes vehicle license plate scans, matches vehicles against active recovery cases using VIN information, and integrates with a partner eligibility service when no existing case is found.

The project was developed as a functional prototype for an Archetype-focused technical demonstration.

## 🚀 Overview

The system receives vehicle scan information such as:
* Image
* License plate
* VIN
* Location
* Scan timestamp

Each scan is stored and evaluated against existing cases.

### Core workflow

```text
Vehicle / Camera
       ↓
License Plate Scan API
       ↓
Save Scan
       ↓
Search Active Case by VIN
       ↓
 ┌───────────────┐
 │ Case Found?   │
 └───────┬───────┘
       Yes                    No
        ↓                      ↓
Update Case Location      Check Partner Eligibility
Trail                         ↓
                         Eligible?
                            ↓
                         Create Case
```

## ✨ Features

* License plate scan processing
* VIN-based case matching
* Vehicle location tracking
* Active case management
* Partner eligibility lookup
* Claim placement
* Case and scan history
* RESTful API architecture
* Swagger/OpenAPI documentation

## 🛠️ Tech Stack

### Backend

* Python
* FastAPI
* Uvicorn
* PostgreSQL
* SQLAlchemy

### API

* REST APIs
* OpenAPI / Swagger

### Development

* Git
* GitHub

## 📌 API Endpoints

### 1. Partner Eligibility

```http
POST /api/v1/partner-eligibility
```

Checks whether a vehicle/VIN is eligible through the partner network.

### 2. Claim Place

```http
POST /api/v1/claim-place
```

Used to look up/place a claim based on the vehicle and case information.

### 3. License Plate Scan

```http
POST /api/v1/scans
```

Receives and stores a vehicle scan containing information such as the license plate, VIN, location, and timestamp.

### 4. Case Scans

```http
GET /api/v1/cases/{case_id}/scans
```

Returns the scan/location history associated with a case.

### 5. Cases

```http
GET /api/v1/cases
```

Retrieves cases and supports filtering such as case status.

## 🔄 Example Processing Flow

When a new vehicle scan is received:

1. The API receives the plate, VIN, location, and timestamp.
2. The scan is saved in the database.
3. The system checks whether an active case exists for the VIN.
4. If a matching case exists, the new location is added to the case's scan history.
5. If no case exists, the system checks the partner eligibility service.
6. Based on the eligibility response, the appropriate case/claim workflow is triggered.

## 📂 Project Structure

```text
plate-scan-case-matching/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── database/
│   │
│   ├── requirements.txt
│   └── ...
│
└── README.md
```

## ▶️ Running Locally

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd plate-scan-case-matching/backend
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure the database

Configure the PostgreSQL connection using the project's environment variables.

Example:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

### 5. Start the application

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at:

```text
http://127.0.0.1:8000
```

### 6. API Documentation

FastAPI automatically provides Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

ReDoc:

```text
http://127.0.0.1:8000/redoc
```

## 🎯 Project Objective

The goal of the project is to demonstrate how a vehicle recovery platform can process incoming license plate scans, match vehicles against active cases, maintain location history, and integrate with external partner services through APIs.

## 🔮 Future Enhancements

* Authentication and role-based access control
* Multi-tenant data isolation
* Production partner API integration
* React-based dashboard
* AWS deployment
* Automated testing and CI/CD
* Improved monitoring and logging

## 👩‍💻 Author

**Sahithi Gayye**

AI Engineer | Full Stack Developer
