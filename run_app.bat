@echo off
title QuizAI - Live Launcher
echo ===================================================
echo 🚀 Starting QuizAI Platform for Live Demo...
echo ===================================================

:: Start Backend Server in Background Window
start "QuizAI Backend API" cmd /k "py -m uvicorn backend.main:app --reload --port 8000"

:: Start Frontend Vite Server in Background Window
start "QuizAI Frontend UI" cmd /k "cd react-ui && npm run dev"

:: Wait 3 seconds for servers to initialize
timeout /t 3 /nobreak > nul

:: Automatically Open App in Default Browser
echo 🌐 Opening QuizAI in your browser...
start http://localhost:5173

echo ===================================================
echo ✅ QuizAI is running live!
echo 📌 Frontend: http://localhost:5173
echo 📌 Backend Docs: http://localhost:8000/docs
echo ===================================================
