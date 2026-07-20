@echo off
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Brak Node.js. Zainstaluj Node.js LTS i uruchom ten plik ponownie.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalowanie zaleznosci...
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Budowanie aplikacji...
call npm run build
if errorlevel 1 (
  pause
  exit /b 1
)
start "ii500 Report server" cmd /c "npm run preview -- --host 127.0.0.1"
timeout /t 2 /nobreak >nul
start http://127.0.0.1:4173
