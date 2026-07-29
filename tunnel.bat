@echo off
echo Starting SSH tunnel to 147.182.131.30...
echo Please enter the password for root when prompted. Do not close this window!
echo.
ssh -L 3307:127.0.0.1:3306 root@147.182.131.30
echo.
echo SSH Tunnel has stopped or an error occurred.
pause
