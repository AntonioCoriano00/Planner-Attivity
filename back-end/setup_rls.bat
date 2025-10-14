@echo off
echo ================================================================
echo           CONFIGURAZIONE ROW LEVEL SECURITY (RLS)
echo ================================================================
echo.

echo [1/4] Verifica dipendenze...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python non trovato. Installa Python 3.7+
    pause
    exit /b 1
)
echo ✅ Python trovato

echo.
echo [2/4] Configurazione database con RLS...
python rls_setup.py
if errorlevel 1 (
    echo ❌ Errore nella configurazione RLS
    pause
    exit /b 1
)
echo ✅ RLS configurato con successo

echo.
echo [3/4] Avvio server backend...
start "Backend Server" cmd /k "python run.py"
timeout /t 3 /nobreak >nul

echo.
echo [4/4] Test RLS...
python test_rls.py
if errorlevel 1 (
    echo ❌ Alcuni test RLS falliti
) else (
    echo ✅ Tutti i test RLS superati
)

echo.
echo ================================================================
echo                    CONFIGURAZIONE COMPLETATA
echo ================================================================
echo.
echo 🎉 Row Level Security (RLS) configurato e testato!
echo.
echo 📝 PROSSIMI PASSI:
echo 1. Il server backend è in esecuzione
echo 2. Avvia il frontend: npm start
echo 3. Accedi con:
echo    - Admin: admin / admin123
echo    - Utente: default / password123
echo.
echo 🔒 CARATTERISTICHE RLS:
echo • Isolamento completo dei dati per utente
echo • Sicurezza a livello database
echo • Policy configurabili
echo • Monitoraggio integrato
echo.
echo 📊 ENDPOINT DISPONIBILI:
echo • GET /api/rls/stats - Statistiche RLS
echo • GET /api/rls/test - Test isolamento (admin)
echo.
pause
