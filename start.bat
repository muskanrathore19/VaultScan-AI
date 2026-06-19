@echo off

echo Starting Server...
start "VaultScan Server" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 5 /nobreak > nul

echo Starting Client...
start "VaultScan Client" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 8 /nobreak > nul

echo Opening Browser...
start chrome http://localhost:5173/login

exit