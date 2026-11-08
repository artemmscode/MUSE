@echo off
rem Stops the local MUSE bot (supervisor + Python process).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop_bot.ps1"
