#Requires -Version 5.1
<#
    Digiturno - inicia todos los servicios en Windows.
    - API (Laravel)       -> http://localhost:8000
    - WebSocket (Reverb)  -> ws://localhost:8081
    - Frontend (Vite)     -> http://localhost:5173
    Presiona Ctrl+C para detener todos los servicios.
#>

param(
    [string]$ApiHost    = '127.0.0.1',
    [int]   $ApiPort    = 8000,
    [string]$ReverbHost = '127.0.0.1',
    [int]   $ReverbPort = 8081,
    [string]$ViteHost   = '127.0.0.1',
    [int]   $VitePort   = 5173,

    # Opcional: usa -PhpPath o -NodeDir si tienes instalaciones fuera del PATH.
    [string]$PhpPath = '',
    [string]$NodeDir = ''
)

$ErrorActionPreference = 'Stop'

# --- Paths ---------------------------------------------------------------
$RootDir     = $PSScriptRoot
$BackendDir  = Join-Path $RootDir 'backend'
$FrontendDir = Join-Path $RootDir 'frontend'
$LogDir      = Join-Path $RootDir '.dev-logs'

$DefaultPhpDirs = @(
    (Join-Path $env:USERPROFILE 'Downloads\php-8.5.1-Win32-vs17-x64'),
    'C:\php',
    'C:\tools\php'
)

$DefaultNodeDirs = @(
    'C:\nvm4w\nodejs',
    'C:\Program Files\nodejs'
)

$script:Pids = @()

# --- Helpers -------------------------------------------------------------
function Add-ToPath {
    param([string]$Dir)

    if ([string]::IsNullOrWhiteSpace($Dir) -or -not (Test-Path -LiteralPath $Dir -PathType Container)) {
        return
    }

    $parts = $env:Path -split ';' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    if ($parts -notcontains $Dir) {
        $env:Path = "$Dir;$env:Path"
    }
}

function Resolve-Exe {
    param(
        [string]$Name,
        [string[]]$CandidatePaths,
        [string]$HelpMessage
    )

    foreach ($candidate in $CandidatePaths) {
        if ([string]::IsNullOrWhiteSpace($candidate)) { continue }

        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }

        if (Test-Path -LiteralPath $candidate -PathType Container) {
            $exePath = Join-Path $candidate $Name
            if (Test-Path -LiteralPath $exePath -PathType Leaf) {
                return (Resolve-Path -LiteralPath $exePath).Path
            }
        }
    }

    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    throw "$Name no fue encontrado. $HelpMessage"
}

function Assert-Path {
    param(
        [string]$Path,
        [string]$Message
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw $Message
    }
}

function Kill-Port {
    param([int]$Port)

    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

    $listeners = netstat -ano |
        Select-String "LISTENING" |
        Select-String ":$Port\s"

    foreach ($listener in $listeners) {
        $parts = ($listener.Line -split '\s+') | Where-Object { $_ }
        if ($parts.Count -gt 0) {
            $processId = [int]$parts[-1]
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
    }
}

function Test-PortListening {
    param([int]$Port)

    $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($listeners) {
        return $true
    }

    $escapedPort = [regex]::Escape(":$Port")
    $listeners = netstat -ano |
        Select-String "LISTENING" |
        Select-String "$escapedPort(\s|$)"

    return [bool]$listeners
}

function Stop-All {
    Write-Host "`nDeteniendo servicios..." -ForegroundColor Yellow

    foreach ($id in $script:Pids) {
        try { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue } catch {}
    }

    foreach ($port in $ApiPort, $ReverbPort, $VitePort) {
        Kill-Port $port
    }

    Write-Host "Servicios detenidos." -ForegroundColor Green
}

function Start-Background {
    param(
        [string]$Exe,
        [string[]]$ArgList,
        [string]$WorkDir,
        [string]$Label,
        [string]$Url,
        [string]$LogName
    )

    $stdout = Join-Path $LogDir "$LogName.out.log"
    $stderr = Join-Path $LogDir "$LogName.err.log"
    Remove-Item -LiteralPath $stdout, $stderr -ErrorAction SilentlyContinue

    Write-Host "=== $Label ===" -ForegroundColor Cyan
    $proc = Start-Process -FilePath $Exe -ArgumentList $ArgList `
        -WorkingDirectory $WorkDir -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput $stdout -RedirectStandardError $stderr

    $script:Pids += $proc.Id
    Write-Host "  $Url  (PID $($proc.Id))" -ForegroundColor Gray
    Write-Host "  Logs: $stdout" -ForegroundColor DarkGray
    return $proc
}

function Assert-Running {
    param(
        [System.Diagnostics.Process]$Process,
        [string]$Label,
        [int]$Port = 0,
        [int]$TimeoutSeconds = 15
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    do {
        Start-Sleep -Milliseconds 500
        $Process.Refresh()

        if ($Process.HasExited) {
            throw "$Label se detuvo inmediatamente. Revisa dependencias y variables .env."
        }

        if ($Port -le 0 -or (Test-PortListening $Port)) {
            return
        }
    } while ((Get-Date) -lt $deadline)

    if ($Process.HasExited) {
        throw "$Label se detuvo inmediatamente. Revisa dependencias y variables .env."
    }

    if ($Port -gt 0 -and -not (Test-PortListening $Port)) {
        throw "$Label no esta escuchando en el puerto $Port. Revisa los logs en $LogDir."
    }
}

function Show-RecentLogs {
    if (-not (Test-Path -LiteralPath $LogDir -PathType Container)) {
        return
    }

    $logs = Get-ChildItem -LiteralPath $LogDir -Filter '*.log' -ErrorAction SilentlyContinue
    foreach ($log in $logs) {
        $content = Get-Content -LiteralPath $log.FullName -Tail 25 -ErrorAction SilentlyContinue
        if ($content) {
            Write-Host "`n--- $($log.Name) ---" -ForegroundColor DarkGray
            $content | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
        }
    }
}

# --- Main ----------------------------------------------------------------
try {
    Assert-Path $BackendDir "No existe la carpeta backend: $BackendDir"
    Assert-Path $FrontendDir "No existe la carpeta frontend: $FrontendDir"
    Assert-Path (Join-Path $BackendDir 'artisan') "No se encontro artisan en: $BackendDir"
    Assert-Path (Join-Path $FrontendDir 'package.json') "No se encontro package.json en: $FrontendDir"
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

    if (-not [string]::IsNullOrWhiteSpace($PhpPath)) {
        if (Test-Path -LiteralPath $PhpPath -PathType Container) {
            Add-ToPath $PhpPath
        } else {
            Add-ToPath (Split-Path -Parent $PhpPath)
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($NodeDir)) {
        Add-ToPath $NodeDir
    }

    foreach ($dir in $DefaultPhpDirs + $DefaultNodeDirs) {
        Add-ToPath $dir
    }

    $PhpExe = Resolve-Exe `
        -Name 'php.exe' `
        -CandidatePaths @($PhpPath) + ($DefaultPhpDirs | ForEach-Object { Join-Path $_ 'php.exe' }) `
        -HelpMessage 'Instala PHP 8.3+ o ejecuta este script con -PhpPath "C:\ruta\a\php.exe".'

    $NpmExe = Resolve-Exe `
        -Name 'npm.cmd' `
        -CandidatePaths @($NodeDir) + ($DefaultNodeDirs | ForEach-Object { Join-Path $_ 'npm.cmd' }) `
        -HelpMessage 'Instala Node.js o ejecuta este script con -NodeDir "C:\ruta\a\nodejs".'

    Write-Host "PHP: $PhpExe" -ForegroundColor DarkGray
    Write-Host "NPM: $NpmExe" -ForegroundColor DarkGray
    Write-Host ''

    foreach ($port in $ApiPort, $ReverbPort, $VitePort) {
        Kill-Port $port
    }
    Start-Sleep -Seconds 1

    $apiProcess = Start-Background -Exe $PhpExe `
        -ArgList @('artisan', 'serve', "--host=$ApiHost", "--port=$ApiPort") `
        -WorkDir $BackendDir `
        -Label 'Iniciando API (Laravel)' `
        -Url "http://localhost:${ApiPort}" `
        -LogName 'api'
    Assert-Running -Process $apiProcess -Label 'API (Laravel)' -Port $ApiPort

    $reverbProcess = Start-Background -Exe $PhpExe `
        -ArgList @('artisan', 'reverb:start', "--host=$ReverbHost", "--port=$ReverbPort") `
        -WorkDir $BackendDir `
        -Label 'Iniciando WebSocket (Reverb)' `
        -Url "ws://localhost:${ReverbPort}" `
        -LogName 'reverb'
    Assert-Running -Process $reverbProcess -Label 'WebSocket (Reverb)' -Port $ReverbPort

    $viteProcess = Start-Background -Exe $NpmExe `
        -ArgList @('run', 'dev', '--', '--host', $ViteHost, '--port', "$VitePort", '--strictPort') `
        -WorkDir $FrontendDir `
        -Label 'Iniciando Frontend (Vite)' `
        -Url "http://localhost:${VitePort}" `
        -LogName 'vite'
    Assert-Running -Process $viteProcess -Label 'Frontend (Vite)' -Port $VitePort

    Start-Sleep -Seconds 3
    Assert-Running -Process $apiProcess -Label 'API (Laravel)' -Port $ApiPort
    Assert-Running -Process $reverbProcess -Label 'WebSocket (Reverb)' -Port $ReverbPort
    Assert-Running -Process $viteProcess -Label 'Frontend (Vite)' -Port $VitePort

    Write-Host ''
    Write-Host '========================================' -ForegroundColor Green
    Write-Host '  Servicios iniciados'                  -ForegroundColor Green
    Write-Host '========================================' -ForegroundColor Green
    Write-Host "  API:        http://localhost:${ApiPort}"   -ForegroundColor White
    Write-Host "  WebSocket:  ws://localhost:${ReverbPort}" -ForegroundColor White
    Write-Host "  Frontend:   http://localhost:${VitePort}"  -ForegroundColor White
    Write-Host "  Logs:       $LogDir"                       -ForegroundColor White
    Write-Host ''
    Write-Host 'Presiona Ctrl+C para detener todos los servicios.' -ForegroundColor DarkGray
    Write-Host ''

    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Show-RecentLogs
    Stop-All
}
