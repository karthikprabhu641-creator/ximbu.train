@echo off
title Railway Journey Portfolio
echo ========================================================
echo  Starting Cinematic Railway Journey Portfolio...
echo ========================================================
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)
call npm run dev
pause
