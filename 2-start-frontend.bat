@echo off
title PlateScan Frontend (React + Vite)
cd /d "%~dp0frontend"
if not exist node_modules (
  echo Installing frontend packages (first time only)...
  call npm install
)
echo.
echo Frontend running at http://localhost:5173   (keep this window open)
echo.
call npm run dev
pause
