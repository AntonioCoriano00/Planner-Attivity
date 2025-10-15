@echo off
echo ============================================================
echo CORREZIONE TRIGGER RLS PER ADMIN
echo ============================================================
echo.

cd /d "%~dp0"
python fix_admin_rls.py

echo.
echo Premi un tasto per continuare...
pause >nul


