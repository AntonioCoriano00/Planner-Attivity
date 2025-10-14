@echo off
echo Test funzionalità multi-giorno e multi-ora...
echo =============================================

cd /d "%~dp0"
python test_multi_activity.py

pause
