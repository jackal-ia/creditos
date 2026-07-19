@echo off
chcp 65001 >nul
title Instalador Servicio IPSFA - Portable
setlocal EnableDelayedExpansion

echo ============================================
echo    INSTALADOR SERVICIO IPSFA v6.7
echo    (Portable - funciona en cualquier PC)
echo ============================================
echo.

:: ============================================================
:: 1. DETECTAR RUTAS AUTOMATICAMENTE
:: ============================================================

:: Ruta donde esta este script (el proyecto)
set "PROYECTO=%~dp0"
set "PROYECTO=%PROYECTO:~0,-1%"

echo [INFO] Proyecto detectado en: %PROYECTO%

:: Buscar Node.js en PATH o en ubicaciones comunes
set "NODEJS="
for %%p in (node.exe) do set "NODEJS=%%~$PATH:p"

if not defined NODEJS (
    if exist "C:\Program Files\nodejs\node.exe" set "NODEJS=C:\Program Files\nodejs\node.exe"
    if exist "C:\Program Files (x86)\nodejs\node.exe" set "NODEJS=C:\Program Files (x86)\nodejs\node.exe"
)

if not defined NODEJS (
    echo [ERROR] Node.js NO encontrado.
    echo [ERROR] Instala Node.js desde: https://nodejs.org
    echo [ERROR] O copia la carpeta de Node.js junto al proyecto.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado: %NODEJS%

:: Buscar NSSM (primero en carpeta tools del proyecto, luego en PATH)
set "NSSM="
if exist "%PROYECTO%\tools\nssm\nssm.exe" set "NSSM=%PROYECTO%\tools\nssm\nssm.exe"
if not defined NSSM if exist "%PROYECTO%\nssm\nssm.exe" set "NSSM=%PROYECTO%\nssm\nssm.exe"
if not defined NSSM for %%p in (nssm.exe) do set "NSSM=%%~$PATH:p"

if not defined NSSM (
    echo.
    echo [AVISO] NSSM no encontrado. Descargando automaticamente...
    echo.

    :: Crear carpeta tools
    if not exist "%PROYECTO%\tools\nssm" mkdir "%PROYECTO%\tools\nssm"

    :: Descargar NSSM (version estable)
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile '%PROYECTO%\tools\nssm.zip'" 2>nul

    if exist "%PROYECTO%\tools\nssm.zip" (
        powershell -Command "Expand-Archive -Path '%PROYECTO%\tools\nssm.zip' -DestinationPath '%PROYECTO%\tools\' -Force"
        :: Buscar nssm.exe dentro del zip extraido
        for /f "delims=" %%a in ('dir /s /b "%PROYECTO%\tools\nssm-2.24\nssm.exe" 2^>nul') do (
            copy "%%a" "%PROYECTO%\tools\nssm\nssm.exe" >nul
        )
        :: Limpiar archivos temporales
        rmdir /s /q "%PROYECTO%\tools\nssm-2.24" 2>nul
        del "%PROYECTO%\tools\nssm.zip" 2>nul
    )

    if exist "%PROYECTO%\tools\nssm\nssm.exe" (
        set "NSSM=%PROYECTO%\tools\nssm\nssm.exe"
        echo [OK] NSSM descargado correctamente.
    ) else (
        echo [ERROR] No se pudo descargar NSSM.
        echo [ERROR] Descargalo manualmente de: https://nssm.cc/download
        echo [ERROR] Y colocalo en: %PROYECTO%\tools\nssm\nssm.exe
        pause
        exit /b 1
    )
)

echo [OK] NSSM encontrado: %NSSM%

:: Detectar archivo principal del servidor
set "SERVER_JS="
for %%f in (server.js app.js index.js main.js) do (
    if exist "%PROYECTO%\%%f" set "SERVER_JS=%%f"
)

if not defined SERVER_JS (
    echo [ERROR] No se encontro archivo de servidor (server.js, app.js, index.js, main.js)
    echo [ERROR] en la carpeta: %PROYECTO%
    pause
    exit /b 1
)

echo [OK] Servidor detectado: %SERVER_JS%

:: ============================================================
:: 2. VERIFICAR SERVICIO EXISTENTE
:: ============================================================

echo.
echo [INFO] Verificando si el servicio ya existe...
sc query IPSFAServer >nul 2>&1
if %errorlevel% == 0 (
    echo [AVISO] El servicio IPSFAServer ya existe.
    echo.
    choice /C SN /M "Deseas eliminarlo y reinstalarlo"
    if !errorlevel! == 1 (
        echo [INFO] Deteniendo servicio...
        net stop IPSFAServer >nul 2>&1
        echo [INFO] Eliminando servicio...
        "%NSSM%" remove IPSFAServer confirm >nul 2>&1
        echo [OK] Servicio anterior eliminado.
    ) else (
        echo [INFO] Instalacion cancelada.
        pause
        exit /b 0
    )
)

:: ============================================================
:: 3. CREAR CARPETA DE LOGS
:: ============================================================

if not exist "%PROYECTO%\logs" mkdir "%PROYECTO%\logs"
echo [OK] Carpeta de logs: %PROYECTO%\logs

:: ============================================================
:: 4. INSTALAR SERVICIO CON NSSM
:: ============================================================

echo.
echo [INFO] Instalando servicio IPSFAServer...
echo.

"%NSSM%" install IPSFAServer "%NODEJS%" >nul 2>&1
"%NSSM%" set IPSFAServer Application "%NODEJS%" >nul 2>&1
"%NSSM%" set IPSFAServer AppDirectory "%PROYECTO%" >nul 2>&1
"%NSSM%" set IPSFAServer AppParameters "%SERVER_JS%" >nul 2>&1
"%NSSM%" set IPSFAServer DisplayName "IPSFA Server v6.7" >nul 2>&1
"%NSSM%" set IPSFAServer Description "Servidor del Sistema de Creditos IPSFA v6.7" >nul 2>&1
"%NSSM%" set IPSFAServer Start SERVICE_AUTO_START >nul 2>&1
"%NSSM%" set IPSFAServer AppStdout "%PROYECTO%\logs\output.log" >nul 2>&1
"%NSSM%" set IPSFAServer AppStderr "%PROYECTO%\logs\error.log" >nul 2>&1
"%NSSM%" set IPSFAServer AppRotateFiles 1 >nul 2>&1
"%NSSM%" set IPSFAServer AppRotateBytes 10485760 >nul 2>&1

:: ============================================================
:: 5. INICIAR SERVICIO
:: ============================================================

echo [INFO] Iniciando servicio...
net start IPSFAServer >nul 2>&1

if %errorlevel% == 0 (
    echo.
    echo ============================================
    echo    [OK] SERVICIO INSTALADO CORRECTAMENTE
    echo ============================================
    echo.
    echo Nombre: IPSFA Server v6.7
    echo Estado: En ejecucion
    echo Auto-inicio: Si (al encender la PC)
    echo Logs: %PROYECTO%\logs\
    echo.
    echo Comandos utiles:
    echo   - net start IPSFAServer    (iniciar)
    echo   - net stop IPSFAServer     (detener)
    echo   - sc query IPSFAServer     (ver estado)
    echo.
) else (
    echo.
    echo [ERROR] No se pudo iniciar el servicio.
    echo [INFO] Revisa los logs en: %PROYECTO%\logs\
    echo.
)

pause
