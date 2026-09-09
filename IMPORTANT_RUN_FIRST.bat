REM ============================================================================
REM IMPORTANT: Run this script once immediately after creating a new project
REM from this template.
REM
REM It installs the frontend and backend dependencies required by the project.
REM After it completes successfully, normal development/build commands can be
REM run without running this script again unless dependencies need reinstalling.
REM ============================================================================

@echo off
setlocal

echo === Installing backend dependencies ===
pushd backend
call npm install
if errorlevel 1 goto :error
popd

echo.
echo === Installing frontend dependencies ===
pushd frontend
call npm install
if errorlevel 1 goto :error
popd

echo.
echo === Project setup complete ===
exit /b 0

:error
echo.
echo ERROR: Project setup failed.
popd
exit /b 1