@echo off
setlocal
chcp 65001 >nul
set "PYTHONIOENCODING=utf-8"
cd /d "%~dp0"
set "COMIC_PREVIEW_RUNTIME=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if exist "%COMIC_PREVIEW_RUNTIME%" (
    "%COMIC_PREVIEW_RUNTIME%" -B "%~dp0web\bluey-reader\preview.py" %*
    goto finished
)
where py >nul 2>nul
if not errorlevel 1 (
    py -3 -B "%~dp0web\bluey-reader\preview.py" %*
    goto finished
)
where python >nul 2>nul
if not errorlevel 1 (
    python -B "%~dp0web\bluey-reader\preview.py" %*
    goto finished
)
echo Python was not found. Please install Python 3 or restore the Codex Python runtime.
pause
exit /b 1
:finished
set "COMIC_PREVIEW_EXIT=%ERRORLEVEL%"
if not "%COMIC_PREVIEW_EXIT%"=="0" pause
exit /b %COMIC_PREVIEW_EXIT%
