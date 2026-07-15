@echo off
setlocal enabledelayedexpansion

title Employee Presence - Configuration Client
echo ============================================
echo  Employee Presence - Installation certificat
echo ============================================
echo.
echo  Ce script installe le certificat de confiance
echo  pour acceder a l'application en HTTPS.
echo  (Execution unique par poste)
echo.
echo  ATTENTION : Execute ce script en tant
echo  qu'ADMINISTRATEUR (clic droit ^> "Executer en tant qu'administrateur")
echo.

REM ----- Vérifier que mkcert est présent -----
if not exist "%~dp0mkcert.exe" (
    echo [ERREUR] mkcert.exe introuvable.
    echo  Copie le fichier setup-client.bat ET mkcert.exe depuis le serveur.
    echo.
    echo  Sinon, telecharge mkcert depuis :
    echo  https://github.com/FiloSottile/mkcert/releases
    echo  et place mkcert.exe dans le meme dossier que ce script.
    pause
    exit /b 1
)

REM ----- Demander l'IP du serveur -----
set /p SERVER_IP= Entrez l'adresse IP du serveur (ex: 192.168.1.42) : 

if "%SERVER_IP%"=="" (
    echo [ERREUR] Adresse IP requise.
    pause
    exit /b 1
)

REM ----- Installer le CA mkcert -----
echo.
echo Installation du certificat de confiance...
"%~dp0mkcert.exe" -install
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Echec de l'installation.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Configuration terminee !
echo ============================================
echo.
echo  Ouvre https://%SERVER_IP% dans ton navigateur.
echo  La connexion sera securisee et la
echo  reconnaissance biométrique fonctionnera.
echo.
pause
