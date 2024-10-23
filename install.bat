@echo off
setlocal enabledelayedexpansion

:: Define repository URL - replace with your repository URL
set "REPO_URL=https://github.com/subhendupsingh/linkedin-message-sender.git"
set "REPO_FOLDER=repository"

echo Checking for Git installation...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git not found. Installing Git...
    
    :: Download Git installer
    curl -o git_installer.exe https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe
    
    :: Install Git silently
    git_installer.exe /VERYSILENT /NORESTART
    
    :: Clean up installer
    del git_installer.exe
    
    :: Add Git to PATH for current session
    set "PATH=%PATH%;C:\Program Files\Git\bin"
    
    echo Git has been installed.
) else (
    echo Git is already installed.
)

:: Clone repository if folder doesn't exist
if not exist "%REPO_FOLDER%" (
    echo Cloning repository...
    git clone %REPO_URL% %REPO_FOLDER%
    if %errorlevel% neq 0 (
        echo Error cloning repository.
        pause
        exit /b 1
    )
    cd %REPO_FOLDER%
) else (
    echo Repository folder already exists. Updating...
    cd %REPO_FOLDER%
    git pull
)

echo Checking for Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found. Installing Node.js...
    
    :: Download Node.js installer
    curl -o nodejs_installer.msi https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi
    
    :: Install Node.js silently
    msiexec /i nodejs_installer.msi /qn
    
    :: Clean up installer
    del nodejs_installer.msi
    
    :: Add Node.js to PATH for current session
    set "PATH=%PATH%;C:\Program Files\nodejs"
    
    echo Node.js has been installed.
) else (
    echo Node.js is already installed.
)

:: Check if npm is available
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npm not found. Please ensure Node.js is installed correctly.
    pause
    exit /b 1
)

:: Check if Playwright is installed
echo Checking for Playwright...
npm list playwright >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Playwright...
    npm init -y
    npm install playwright
)

:: Install Playwright browsers (including Chromium)
echo Installing Playwright browsers...
npx playwright install chromium

:: Install project dependencies
echo Installing project dependencies...
npm install

:: Run the Node.js script
echo Running Node.js script...
node index.js

if %errorlevel% neq 0 (
    echo Error occurred while running the script.
    pause
    exit /b 1
)

echo Script execution completed successfully.
pause
exit /b 0