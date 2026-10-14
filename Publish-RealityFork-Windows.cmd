@echo off
setlocal
cd /d "%~dp0"
where powershell.exe >nul 2>&1
if errorlevel 1 (
  echo PowerShell is required to run this publisher.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\publish-windows.ps1"
if errorlevel 1 (
  echo.
  echo Publishing did not finish. Read the error message above.
  pause
  exit /b 1
)
echo.
echo Publishing command completed.
pause
