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

REM ----- Détecter l'IP locale + IP Docker -----
echo.
echo Detection des adresses IP...
set "IP="
set "DOCKER_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"Adresse IPv4" /c:"IPv4 Address"') do (
    set "RAW_IP=%%a"
    set "RAW_IP=!RAW_IP: =!"
    set "FIRST=!RAW_IP:~0,3!"
    if "!FIRST!"=="172" set "DOCKER_IP=!RAW_IP!"
    if not "!FIRST!"=="172" if not "!FIRST!"=="169" if not "!FIRST!"=="127" (
        if not defined IP set "IP=!RAW_IP!"
    )
)
if "%IP%"=="" (
    echo [ERREUR] Impossible de detecter l'IP locale automatiquement.
    set /p "IP=Entrez l'adresse IP du serveur (ex: 192.168.1.42) : "
)
if "%IP%"=="" (
    echo [ERREUR] Aucune IP saisie.
    pause
    exit /b 1
)
echo [OK] IP reseau detectee : %IP%
if not "%DOCKER_IP%"=="" echo [OK] IP Docker detectee : %DOCKER_IP%

REM ----- Configurer DuckDNS -----
echo.
echo ============================================
echo  Configuration DuckDNS
echo ============================================
echo.
echo  DuckDNS est un service gratuit qui donne un nom de domaine
echo  a votre serveur local, necessaire pour la reconnaissance
echo  biométrique (WebAuthn).
echo.
echo  1. Va sur https://www.duckdns.org et connecte-toi
echo  2. Cree un sous-domaine (ex: employee-presence)
echo  3. Entre l'IP %IP% et sauvegarde
echo  4. Copie le token affiche sur la page
echo.
set /p "DUCKDNS_DOMAIN=Entre ton domaine DuckDNS (ex: employee-presence.duckdns.org) : "
if "%DUCKDNS_DOMAIN%"=="" (
    echo [ERREUR] Domaine requis.
    pause
    exit /b 1
)
set /p "DUCKDNS_TOKEN=Entre ton token DuckDNS : "
if "%DUCKDNS_TOKEN%"=="" (
    echo [ERREUR] Token requis.
    pause
    exit /b 1
)
echo [OK] Domaine DuckDNS configure : %DUCKDNS_DOMAIN%

REM ----- Créer le fichier .env pour docker-compose -----
echo.
echo Configuration de l'environnement...
echo APP_ENV=local > "%CD%\.env"
echo APP_DEBUG=true >> "%CD%\.env"
echo ADMIN_EMAIL=admin@employee-presence.com >> "%CD%\.env"
echo ADMIN_PASSWORD=admin123 >> "%CD%\.env"
echo DUCKDNS_DOMAIN=%DUCKDNS_DOMAIN% >> "%CD%\.env"
echo DUCKDNS_TOKEN=%DUCKDNS_TOKEN% >> "%CD%\.env"

REM ----- Détecter docker compose ou docker-compose -----
echo.
echo Detection de docker-compose...
set "DC=docker compose"
docker compose version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    docker-compose version >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [ERREUR] Docker Compose n'est pas disponible.
        echo  Active Docker Compose V2 dans Docker Desktop ^> General
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
    echo [ERREUR] docker-compose.yml introuvable.
    echo  Execute le script depuis le dossier du projet.
    pause
    exit /b 1
)

REM ----- Ouverture des ports pare-feu -----
echo.
echo Ouverture des ports pare-feu (administrateur requis)...
netsh advfirewall firewall show rule name="Employee Presence HTTPS" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    netsh advfirewall firewall add rule name="Employee Presence HTTPS" dir=in action=allow protocol=TCP localport=443
    if %ERRORLEVEL% EQU 0 ( echo [OK] Port 443 ouvert ) else ( echo [AVERTISSEMENT] Impossible d'ouvrir le port 443 )
) else (
    echo [OK] Regle pare-feu deja presente
)
netsh advfirewall firewall show rule name="Employee Presence HTTP" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    netsh advfirewall firewall add rule name="Employee Presence HTTP" dir=in action=allow protocol=TCP localport=80
    if %ERRORLEVEL% EQU 0 ( echo [OK] Port 80 ouvert ) else ( echo [AVERTISSEMENT] Impossible d'ouvrir le port 80 )
) else (
    echo [OK] Regle pare-feu deja presente
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
echo  URL de l'application : https://%DUCKDNS_DOMAIN%
echo.
echo  Email admin : admin@employee-presence.com
echo  Mot de passe : admin123
echo.
echo  AUCUNE installation necessaire sur les autres postes !
echo  Let's Encrypt est deja reconnu par tous les navigateurs.
echo.
echo  Partage simplement l'URL https://%DUCKDNS_DOMAIN%
echo  a tous les employes, ca marche sur PC, Mac, Android et iOS.
echo.
echo  Pour arreter le serveur : %DC% down
echo  Pour redemarrer      : %DC% start
echo.
pause
