@echo off
setlocal
cd /d "%~dp0"
set "GARDEN_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "GARDEN_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
"%GARDEN_NODE%" "%~dp0frontend\web\scripts\serve.mjs"
set "GARDEN_EXIT=%ERRORLEVEL%"
if not "%GARDEN_EXIT%"=="0" pause
exit /b %GARDEN_EXIT%
