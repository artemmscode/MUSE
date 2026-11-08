# Stops the local MUSE bot: the supervisor (run_bot.bat) and the Python process.
# Run stop_bot.bat instead of calling this file directly.

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Get-MuseProcesses {
    Get-CimInstance Win32_Process | Where-Object {
        $_.CommandLine -and (
            $_.CommandLine -like "*$root*main.py*" -or
            $_.CommandLine -like "*$root*run_bot.bat*"
        )
    }
}

$targets = Get-MuseProcesses
if (-not $targets) {
    Write-Host "MUSE Bot is not running."
    exit 0
}

# Kill the supervisor first so it cannot restart Python, then the bot itself.
foreach ($process in ($targets | Where-Object { $_.Name -eq "cmd.exe" })) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped supervisor PID $($process.ProcessId)"
}
foreach ($process in ($targets | Where-Object { $_.Name -ne "cmd.exe" })) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped bot PID $($process.ProcessId)"
}

Start-Sleep -Seconds 1
$left = Get-MuseProcesses
if ($left) {
    foreach ($process in $left) {
        Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped leftover PID $($process.ProcessId)"
    }
}

Write-Host "MUSE Bot stopped."
