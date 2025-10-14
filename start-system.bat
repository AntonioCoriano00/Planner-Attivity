@echo off
echo ========================================
echo    AVVIO SISTEMA PLANNER ATTIVITA'
echo ========================================
echo.

echo 1. Installazione dipendenze React...
cd planner-activity3\planner-activity
call npm install
if %errorlevel% neq 0 (
    echo ERRORE: Installazione dipendenze React fallita
    pause
    exit /b 1
)

echo.
echo 2. Installazione dipendenze Backend...
cd ..\back-end
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERRORE: Installazione dipendenze Backend fallita
    pause
    exit /b 1
)

echo.
echo 3. Creazione file .env per React...
cd ..\planner-activity
if not exist .env (
    echo REACT_APP_API_URL=http://localhost:5000/api > .env
    echo REACT_APP_API_TIMEOUT=10000 >> .env
    echo File .env creato con successo
) else (
    echo File .env gia' esistente
)

echo.
echo ========================================
echo    SISTEMA CONFIGURATO CORRETTAMENTE
echo ========================================
echo.
echo Per avviare il sistema:
echo 1. Apri un terminale e vai in planner-activity3\back-end
echo 2. Esegui: python run.py
echo 3. Apri un altro terminale e vai in planner-activity3\planner-activity  
echo 4. Esegui: npm start
echo.
echo Il backend sara' disponibile su: http://localhost:5000
echo Il frontend sara' disponibile su: http://localhost:3000
echo.
pause
