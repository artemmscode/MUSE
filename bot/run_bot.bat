@echo off
rem ===========================================================================
rem  MUSE Bot - local supervisor
rem
rem  Runs the Telegram bot with the project virtualenv and restarts it if the
rem  process ever exits. Output goes to logs\bot.log (rotated at 5 MB).
rem
rem  Do not run this file directly. Use run_bot.vbs (hidden) or the shortcut
rem  in the Windows Startup folder.
rem ===========================================================================
setlocal
cd /d "%~dp0"

if not exist "logs" mkdir "logs"

rem Rotate the log when it grows past 5 MB.
if exist "logs\bot.log" for %%A in ("logs\bot.log") do if %%~zA GTR 5242880 (
  if exist "logs\bot.log.old" del /q "logs\bot.log.old"
  move /y "logs\bot.log" "logs\bot.log.old" >nul
)

:loop
echo. >> "logs\bot.log"
echo ==== %date% %time% starting MUSE Bot ==== >> "logs\bot.log"
"%~dp0.venv\Scripts\python.exe" -u "%~dp0main.py" >> "logs\bot.log" 2>&1
echo ==== %date% %time% bot stopped (exit %errorlevel%), restart in 15s ==== >> "logs\bot.log"
timeout /t 15 /nobreak >nul
goto loop
