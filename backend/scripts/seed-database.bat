@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "PSQL="
set "DB_NAME=exampledb"

for /d %%D in ("C:\Program Files\PostgreSQL\*") do (
    if exist "%%~fD\bin\psql.exe" (
        set "PSQL=%%~fD\bin\psql.exe"
    )
)

if not defined PSQL (
    echo ERROR: PostgreSQL psql.exe was not found under C:\Program Files\PostgreSQL.
    exit /b 1
)

set "SQLFILE=%~dp0..\seeds\001_database_seed.sql"

if not exist "%SQLFILE%" (
    echo ERROR: Seed SQL file was not found:
    echo %SQLFILE%
    exit /b 1
)

echo Using: "!PSQL!"
echo Seed file: "%SQLFILE%"
echo.

REM Prompt once without displaying the password.
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$p=Read-Host 'PostgreSQL postgres password' -AsSecureString; $b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($p); try {[Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)} finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)}"`) do (
    set "PGPASSWORD=%%P"
)

if not defined PGPASSWORD (
    echo ERROR: No PostgreSQL password was entered.
    exit /b 1
)

"!PSQL!" -X -h localhost -p 5432 -U postgres -d "%DB_NAME%" -v ON_ERROR_STOP=1 -f "%SQLFILE%"

set "RESULT=!ERRORLEVEL!"
set "PGPASSWORD="

if not "!RESULT!"=="0" (
    echo.
    echo ERROR: Database seed failed.
    exit /b !RESULT!
)

echo.
echo Database seeded successfully.
exit /b 0