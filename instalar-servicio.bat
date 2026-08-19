@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================
echo   INSTALADOR SERVICIO IPSFA v6.7
echo ============================================
echo.

:: --- 1. Detectar carpeta del proyecto ---
set "IPSFA_PATH=%~dp0"
if "%IPSFA_PATH:~-1%"=="\" set "IPSFA_PATH=%IPSFA_PATH:~0,-1%"
echo [INFO] Proyecto detectado en: %IPSFA_PATH%

:: --- 2. Verificar Admin ---
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Ejecutar como Administrador
    echo         Click derecho -^> Ejecutar como administrador
    pause
    exit /b 1
)
echo [OK] Privilegios de administrador confirmados

:: --- 3. Verificar Node.js ---
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js NO encontrado.
    echo         Instala Node.js desde: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js encontrado
for /f "delims=" %%a in ('node --version') do echo     Version: %%a

for /f "delims=" %%a in ('where node') do set "NODE_EXE=%%a"
echo [OK] Ruta: %NODE_EXE%

:: --- 4. Verificar NSSM ---
set "NSSM_PATH=%IPSFA_PATH%\tools\nssm\nssm.exe"
if not exist "%NSSM_PATH%" (
    echo [ERROR] NSSM no encontrado: %NSSM_PATH%
    echo         Descargalo de nssm.cc y ponlo en tools\nssm\
    pause
    exit /b 1
)
echo [OK] NSSM encontrado: %NSSM_PATH%

:: --- 5. Verificar archivos del proyecto ---
if not exist "%IPSFA_PATH%\server.js" (
    echo [ERROR] server.js NO encontrado
    pause
    exit /b 1
)
echo [OK] server.js encontrado

if not exist "%IPSFA_PATH%\node_modules" (
    echo [ERROR] node_modules no encontrado. Ejecuta: npm install
    pause
    exit /b 1
)
echo [OK] node_modules encontrado

if not exist "%IPSFA_PATH%\.env" (
    echo [ADVERTENCIA] .env no encontrado. El sistema puede fallar.
)

:: --- 6. Crear logs ---
if not exist "%IPSFA_PATH%\logs" mkdir "%IPSFA_PATH%\logs"
echo [OK] Carpeta logs creada

:: --- 7. Eliminar servicio anterior ---
echo.
echo [INFO] Eliminando servicio anterior si existe...
"%NSSM_PATH%" stop IPSFA >nul 2>&1
timeout /t 2 /nobreak >nul
"%NSSM_PATH%" remove IPSFA confirm >nul 2>&1
echo [OK] Listo

:: --- 8. Instalar servicio ---
echo.
echo [INFO] Instalando servicio IPSFA...
"%NSSM_PATH%" install IPSFA "%NODE_EXE%" "%IPSFA_PATH%\server.js"
if %errorlevel% neq 0 (
    echo [ERROR] NSSM fallo al instalar
    pause
    exit /b 1
)
echo [OK] Servicio instalado

:: --- 9. Configurar ---
echo [INFO] Configurando...
"%NSSM_PATH%" set IPSFA AppDirectory "%IPSFA_PATH%"
"%NSSM_PATH%" set IPSFA DisplayName "IPSFA Sistema de Creditos v6.7"
"%NSSM_PATH%" set IPSFA Description "Backend IPSFA - Node.js + Express"
"%NSSM_PATH%" set IPSFA Start SERVICE_AUTO_START
"%NSSM_PATH%" set IPSFA AppExit Default Restart
"%NSSM_PATH%" set IPSFA AppRestartDelay 10000

:: Logs
"%NSSM_PATH%" set IPSFA AppStdout "%IPSFA_PATH%\logs\stdout.log"
"%NSSM_PATH%" set IPSFA AppStderr "%IPSFA_PATH%\logs\stderr.log"
echo [OK] Configuracion aplicada

:: --- 10. Iniciar ---
echo.
echo [INFO] Iniciando servicio...
"%NSSM_PATH%" start IPSFA
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo iniciar
    echo         Revisa: %IPSFA_PATH%\logs\
    pause
    exit /b 1
)

:: --- 11. Listo ---
echo.
echo ============================================
echo   [OK] SERVICIO IPSFA INSTALADO Y CORRIENDO
echo ============================================
echo.
echo  Accede a: http://localhost:3000
echo.
echo  Para gestionar el servicio:
echo  - services.msc  (abrir Services)
echo  - O usa: nssm edit IPSFA
echo.
echo  Logs en: %IPSFA_PATH%\logs\
echo.
pause