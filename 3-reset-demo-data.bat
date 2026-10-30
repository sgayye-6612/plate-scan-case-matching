@echo off
title PlateScan - Reset demo data
cd /d "%~dp0backend"
if not exist venv (
  echo Run 1-start-backend.bat first.
  pause
  exit /b
)
call venv\Scripts\activate
python -m app.seed
pause
