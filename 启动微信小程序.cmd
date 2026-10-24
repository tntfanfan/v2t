@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

if defined WECHAT_DEVTOOLS_DIR (
  set "DEVTOOLS_DIR=%WECHAT_DEVTOOLS_DIR%"
) else (
  set "DEVTOOLS_DIR=%ProgramFiles(x86)%\Tencent\微信web开发者工具"
)

if not exist "%DEVTOOLS_DIR%\cli.bat" (
  echo 找不到微信开发者工具 CLI: "%DEVTOOLS_DIR%\cli.bat"
  echo 请安装微信开发者工具，或设置 WECHAT_DEVTOOLS_DIR 为其安装目录。
  set "LAUNCH_EXIT=1"
  goto finish
)

if not exist "%DEVTOOLS_DIR%\微信开发者工具.exe" (
  echo 找不到微信开发者工具程序: "%DEVTOOLS_DIR%\微信开发者工具.exe"
  echo 请检查 WECHAT_DEVTOOLS_DIR 是否指向正确的安装目录。
  set "LAUNCH_EXIT=1"
  goto finish
)

start "" "%DEVTOOLS_DIR%\微信开发者工具.exe"
ping -n 6 127.0.0.1 >nul
call "%DEVTOOLS_DIR%\cli.bat" open --project "%~dp0frontend\miniprogram"
set "LAUNCH_EXIT=%ERRORLEVEL%"
echo.
if not "%LAUNCH_EXIT%"=="0" (
  echo 如果项目没有打开，且提示服务端口已关闭，请在微信开发者工具的设置中的安全设置里启用服务端口，然后重新运行此启动器。
)

:finish
if /i not "%~1"=="/nopause" pause
exit /b %LAUNCH_EXIT%
