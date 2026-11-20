@echo off
echo.
echo  ============================================================
echo   HACKLAB - Laboratorio de Hacking Etico
echo   Iniciando ambos servidores...
echo  ============================================================
echo.

REM Iniciar servidor VULNERABLE (puerto 3000)
start "SecureBank VULNERABLE :3000" cmd /k "cd /d "%~dp0hacklab-vulnerable" && node server.js"

REM Esperar 1 segundo
timeout /t 1 /nobreak >nul

REM Iniciar servidor SEGURO (puerto 4000)
start "SecureBank SEGURO :4000" cmd /k "cd /d "%~dp0hacklab-seguro" && node server.js"

echo.
echo  Servidores iniciados:
echo.
echo   [VULNERABLE]  http://localhost:3000   (para los ataques)
echo   [SEGURO]      http://localhost:4000   (version protegida)
echo.
echo  Presione cualquier tecla para cerrar esta ventana...
pause >nul
