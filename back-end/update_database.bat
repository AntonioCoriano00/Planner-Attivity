@echo off
echo Aggiornamento database per attività multi-giorno/multi-ora...
echo ============================================================

cd /d "%~dp0"
python update_db.py

pause
