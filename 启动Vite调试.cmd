@echo off
setlocal
cd /d "%~dp0"
set "VITE_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
    set "VITE_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)
if not exist "node_modules\vite\bin\vite.js" (
    echo Vite dependencies are missing. Run pnpm install in this directory first.
    pause
    exit /b 1
)
"%VITE_NODE%" "%~dp0node_modules\vite\bin\vite.js" %*
set "VITE_EXIT=%ERRORLEVEL%"
if not "%VITE_EXIT%"=="0" pause
exit /b %VITE_EXIT%
