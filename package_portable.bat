@echo off
set "DEST_DIR=%USERPROFILE%\Desktop\Farmacorp_Portable"
echo Creando versión portable SILENCIOSA (SQL SERVER) en %DEST_DIR%...

if exist "%DEST_DIR%" (
    rmdir /S /Q "%DEST_DIR%"
)
mkdir "%DEST_DIR%"

echo Copiando archivos de aplicacion...
robocopy ".next\standalone" "%DEST_DIR%" /E /NFL /NDL /NJH /NJS
robocopy "node_modules" "%DEST_DIR%\node_modules" /E /XD ".cache" ".bin" "typescript" /NFL /NDL /NJH /NJS 
robocopy "public" "%DEST_DIR%\public" /E /NFL /NDL /NJH /NJS
mkdir "%DEST_DIR%\.next\static"
robocopy ".next\static" "%DEST_DIR%\.next\static" /E /NFL /NDL /NJH /NJS

echo Copiando binarios Node.js...
mkdir "%DEST_DIR%\bin"
copy "C:\Program Files\nodejs\node.exe" "%DEST_DIR%\bin\" >NUL

echo Configurando .env...
(
  echo DATABASE_URL="sqlserver://localhost:1433;database=Farmacorp;integratedSecurity=true;trustServerCertificate=true;"
  echo PORT=3000
) > "%DEST_DIR%\.env"

echo Creando script interno (Logica)...
(
  echo @echo off
  echo cd /d "%%~dp0"
  echo.
  echo REM Lanzar navegador despues de 5 segundos
  echo start /b cmd /c "timeout /t 5 >nul && start http://localhost:3000"
  echo.
  echo REM Iniciar servidor Node bloqueante ^(pero oculto^)
  echo bin\node.exe server.js
) > "%DEST_DIR%\_system_start.bat"

echo Creando VBS Launcher (Para ocultar ventana)...
(
  echo Set WshShell = CreateObject^("WScript.Shell"^)
  echo WshShell.Run chr^(34^) ^& "%%~dp0_system_start.bat" ^& chr^(34^), 0
  echo Set WshShell = Nothing
) > "%DEST_DIR%\INICIAR_SISTEMA.vbs"

echo Creando script de Parada...
(
  echo @echo off
  echo TITLE Deteniendo Farmacorp
  echo echo Deteniendo procesos de Farmacorp...
  echo taskkill /F /IM node.exe
  echo echo.
  echo echo Sistema detenido.
  echo timeout /t 2
) > "%DEST_DIR%\DETENER_SISTEMA.bat"

echo.
echo Version portable generada.
echo Utilice 'INICIAR_SISTEMA.vbs' para arrancar sin ventana negra.
pause
