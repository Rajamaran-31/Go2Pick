@echo off
echo ========================================
echo   Go2Pick Backend - Windows Setup
echo ========================================

echo.
echo [1/4] Removing old broken venv...
if exist venv rmdir /s /q venv

echo [2/4] Creating fresh virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.10+ from python.org
    pause
    exit /b 1
)

echo [3/4] Upgrading pip...
venv\Scripts\python.exe -m pip install --upgrade pip

echo [4/4] Installing dependencies...
venv\Scripts\pip.exe install -r requirements.txt

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Activate: venv\Scripts\activate
echo   2. Run:      python run.py
echo   3. Docs:     http://localhost:8000/docs
echo.
pause
