@echo off
setlocal enabledelayedexpansion

title Employee Presence - Setup Serveur
echo ============================================
echo  Employee Presence - Configuration du serveur
echo ============================================
echo.

REM ----- Vérifier Docker -----
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Docker Desktop n'est pas installe.
    echo  Telecharge-le depuis https://www.docker.com/products/docker-desktop/
    echo  Installe-le, puis relance ce script.
    pause
    exit /b 1
)
echo [OK] Docker trouve

REM ----- Vérifier que Docker Desktop tourne -----
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Docker Desktop n'est pas en cours d'execution.
    echo  Lance Docker Desktop depuis le menu Demarrer, puis relance ce script.
    pause
    exit /b 1
)
echo [OK] Docker Desktop en cours d'execution

REM ----- Détecter l'IP locale -----
echo.
echo Detection de l'adresse IP locale...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"Adresse IPv4"') do (
    set "IP=%%a"
    goto :IP_FOUND
)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "IP=%%a"
    goto :IP_FOUND
)
:IP_FOUND
set "IP=%IP: =%"
if "%IP%"=="" (
    echo [ERREUR] Impossible de detecter l'adresse IP locale.
    pause
    exit /b 1
)
echo [OK] IP detectee : %IP%

REM ----- Créer le dossier certs -----
if not exist "%CD%\certs" mkdir "%CD%\certs"

REM ----- Installer mkcert si nécessaire -----
echo.
echo Verification de mkcert...
where mkcert >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo mkcert non trouve. Telechargement...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-windows-amd64.exe' -OutFile '%TEMP%\mkcert.exe'}"
    if not exist "%TEMP%\mkcert.exe" (
        echo [ERREUR] Echec du telechargement de mkcert.
        echo  Telecharge-le manuellement depuis https://github.com/FiloSottile/mkcert/releases
        echo  Place mkcert.exe dans un dossier du PATH ou dans ce dossier.
        pause
        exit /b 1
    )
    move /Y "%TEMP%\mkcert.exe" "%CD%\mkcert.exe" >nul
    echo [OK] mkcert telecharge
)

REM ----- Installer le CA local et generer le certificat -----
echo.
echo Generation du certificat SSL pour %IP%...
mkcert -install >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Impossible d'installer le CA mkcert.
    pause
    exit /b 1
)
echo [OK] CA mkcert installe

mkcert -cert-file "%CD%\certs\server.pem" -key-file "%CD%\certs\server-key.pem" %IP% 127.0.0.1 localhost >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Impossible de generer le certificat.
    pause
    exit /b 1
)
echo [OK] Certificat SSL genere pour %IP%

REM ----- Créer le fichier .env pour docker-compose -----
echo.
echo Configuration de l'environnement...
echo APP_HOST=%IP% > "%CD%\.env"
echo APP_ENV=local >> "%CD%\.env"
echo APP_DEBUG=true >> "%CD%\.env"
echo ADMIN_EMAIL=admin@employee-presence.com >> "%CD%\.env"
echo ADMIN_PASSWORD=admin123 >> "%CD%\.env"

REM ----- Lancer Docker Compose -----
echo.
echo Construction et demarrage des conteneurs...
echo (La premiere fois peut prendre plusieurs minutes)
echo.
docker compose up -d --build
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Docker compose a echoue.
    pause
    exit /b 1
)

REM ----- Détecter docker compose ou docker-compose -----
echo.
echo Detection de docker-compose...
set "DC=docker compose"
docker compose version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    docker-compose version >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [ERREUR] Ni 'docker compose' ni 'docker-compose' n'est disponible.
        echo  Active Docker Compose V2 dans Docker Desktop ^> Parametres ^> General
        echo  OU installe docker-compose separement.
        pause
        exit /b 1
    )
    set "DC=docker-compose"
    echo [OK] docker-compose (v1) trouve
) else (
    echo [OK] docker compose (v2) trouve
)

REM ----- Vérifier le fichier docker-compose.yml -----
if not exist "%CD%\docker-compose.yml" (
    echo [ERREUR] docker-compose.yml introuvable dans %CD%
    echo  Verifie que le script est execute dans le dossier du projet.
    pause
    exit /b 1
)

REM ----- Lancer Docker Compose -----
echo.
echo Construction et demarrage des conteneurs...
echo (La premiere fois peut prendre plusieurs minutes)
echo.
%DC% up -d --build
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Docker compose a echoue.
    pause
    exit /b 1
)

REM ----- Vérifier que les conteneurs tournent -----
echo.
echo Verification des conteneurs...
%DC% ps
echo.

echo ============================================
echo  Configuration terminee !
echo ============================================
echo.
echo  URL de l'application : https://%IP%
echo.
echo  Email admin : admin@employee-presence.com
echo  Mot de passe : admin123
echo.
echo  INSTRUCTIONS pour les autres postes :
echo    1. Copie le fichier  setup-client.bat  sur chaque PC
echo    2. Execute-le en tant qu'administrateur
echo    3. Ouvre https://%IP% dans le navigateur
echo.
echo  Pour arreter le serveur : %DC% down
echo  Pour redemarrer      : %DC% start
echo.
pause
