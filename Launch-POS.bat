@echo off
title Supermarket POS Launcher
cd /d "%~dp0"
if exist "Supermarket-POS.exe" (
    start "" "Supermarket-POS.exe"
) else (
    start "" npm start
)
exit

