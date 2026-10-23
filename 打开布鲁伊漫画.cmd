@echo off
setlocal
title Bluey - local website
cd /d "%~dp0"
set "SITE_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "SITE_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

"%SITE_NODE%" "%~dp0scripts\check-local-site.mjs" 5173 "Bluey"
set "SITE_STATE=%ERRORLEVEL%"
if "%SITE_STATE%"=="0" goto open_page
if not "%SITE_STATE%"=="10" goto failed

if not exist "node_modules\vite\bin\vite.js" (
    echo Vite dependencies are missing. Run pnpm install in this folder first.
    goto failed
)
echo Keep this window open while using the website. You can minimize it.
"%SITE_NODE%" "%~dp0node_modules\vite\bin\vite.js" --host 127.0.0.1 --port 5173 --strictPort --open
if errorlevel 1 goto failed
exit /b 0

:open_page
start "" "http://127.0.0.1:5173/"
exit /b 0

:failed
echo The website could not be opened. See the message above.
pause
exit /b 1
