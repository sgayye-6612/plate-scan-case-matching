@echo off
title PlateScan Backend (FastAPI)
cd /d "%~dp0backend"
if not exist venv (
  echo Creating Python virtual environment...
  python -m venv venv
)
call venv\Scripts\activate
echo Installing backend packages (first time can take a minute)...
pip install -r requirements.txt --quiet
echo.
echo Backend running at http://localhost:8000   (keep this window open)
echo.
uvicorn app.main:app --reload
pause
