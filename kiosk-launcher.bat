@echo off
setlocal

set "APP_DIR=%~dp0"
set "CHROME_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"

if not exist "%CHROME_EXE%" (
  set "CHROME_EXE=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

if not exist "%CHROME_EXE%" (
  echo Chrome not found. Install Chrome or update CHROME_EXE path in kiosk-launcher.bat.
  pause
  exit /b 1
)

cd /d "%APP_DIR%"

rem Start any local static server first (python) in a background window
start "" /min cmd /c "python -m http.server 5500"

rem Give server time to boot
timeout /t 2 /nobreak >nul

start "" "%CHROME_EXE%" --kiosk "http://127.0.0.1:5500/index.html" --incognito --no-first-run --disable-pinch --overscroll-history-navigation=0 --autoplay-policy=no-user-gesture-required

endlocal
