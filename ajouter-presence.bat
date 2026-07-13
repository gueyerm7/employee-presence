@echo off
title Configuration Presence Employee
echo ====================================
echo  Configuration Presence Employee
echo ====================================
echo.
echo Ce script ajoute l'entree necessaire
echo dans le fichier hosts de Windows.
echo.
echo Execution requise en administrateur.
echo.

:: Verification des droits administrateur
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERREUR] Tu dois executer ce script
    echo          en tant qu'administrateur.
    echo.
    echo  Clic droit sur le fichier -^> "Executer
    echo  en tant qu'administrateur"
    echo.
    pause
    exit /b 1
)

:: Ajout de l'entree dans hosts
echo. >> %windir%\System32\drivers\etc\hosts
echo # Employee Presence >> %windir%\System32\drivers\etc\hosts
echo 192.168.100.200  presence.local >> %windir%\System32\drivers\etc\hosts

echo.
echo [OK] Termine !
echo.
echo Ouvre maintenant https://presence.local:8000
echo dans ton navigateur.
echo.
pause
