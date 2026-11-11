@echo off
chcp 65001 >nul
title CyberTwin Cozy Studio - 赛博伴生桌面客户端启动器
cd /d "%~dp0"
echo ======================================================================
echo   正在启动《CyberTwin Cozy Studio · 赛博伴生》独立桌面软件客户端...
echo ======================================================================
start /b npm run dev
timeout /t 2 /nobreak >nul
node scripts/launch-desktop.mjs
