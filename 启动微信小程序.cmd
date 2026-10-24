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

call "%DEVTOOLS_DIR%\cli.bat" open --project "%~dp0frontend\miniprogram"
set "LAUNCH_EXIT=%ERRORLEVEL%"
echo.
echo 如果项目没有打开，且提示服务端口已关闭，请在微信开发者工具的“设置 > 安全设置”中启用服务端口后重试。

:finish
if /i not "%~1"=="/nopause" pause
exit /b %LAUNCH_EXIT%
