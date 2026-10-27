$ErrorActionPreference = 'Stop'

$script:failureCount = 0

function Write-Check {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [bool]$Passed,
        [Parameter(Mandatory = $true)]
        [string]$Details
    )

    if ($Passed) {
        Write-Host "[OK]     $Name - $Details" -ForegroundColor Green
    }
    else {
        Write-Host "[GAGAL]  $Name - $Details" -ForegroundColor Red
        $script:failureCount++
    }
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $nodeCommand) {
    Write-Check -Name 'Node.js' -Passed $false -Details 'Tidak ditemukan di PATH. Pasang Node.js 22 atau lebih baru (minimum repo: 22.11.0).'
}
else {
    $nodeOutput = (& node --version 2>&1 | Out-String).Trim()
    $nodeMatch = [regex]::Match($nodeOutput, '^v?(?<version>\d+\.\d+\.\d+)')
    if ($LASTEXITCODE -eq 0 -and $nodeMatch.Success) {
        $nodeVersion = [version]$nodeMatch.Groups['version'].Value
        $nodePassed = $nodeVersion -ge [version]'22.11.0'
        Write-Check -Name 'Node.js' -Passed $nodePassed -Details "Terpasang: $nodeOutput; minimum: 22.11.0."
    }
    else {
        Write-Check -Name 'Node.js' -Passed $false -Details "Versi tidak dapat dibaca dari output: $nodeOutput"
    }
}

$javaCommand = Get-Command java -ErrorAction SilentlyContinue
if ($null -eq $javaCommand) {
    Write-Check -Name 'Java' -Passed $false -Details 'java tidak ditemukan di PATH. Pasang JDK 17 dan atur JAVA_HOME.'
}
else {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $javaOutput = (& java -version 2>&1 | Out-String).Trim()
    $javaExitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
    $javaMatch = [regex]::Match($javaOutput, '(?m)version "(?:1\.)?(?<major>\d+)')
    if ($javaExitCode -eq 0 -and $javaMatch.Success) {
        $javaMajor = [int]$javaMatch.Groups['major'].Value
        $javaPassed = $javaMajor -eq 17
        Write-Check -Name 'Java' -Passed $javaPassed -Details "Versi major terdeteksi: $javaMajor; diperlukan: 17."
    }
    else {
        Write-Check -Name 'Java' -Passed $false -Details "Versi tidak dapat dibaca dari output: $javaOutput"
    }
}

$androidHome = $env:ANDROID_HOME
$androidHomeExists = -not [string]::IsNullOrWhiteSpace($androidHome) -and (Test-Path -LiteralPath $androidHome -PathType Container)
if ($androidHomeExists) {
    Write-Check -Name 'ANDROID_HOME' -Passed $true -Details "Folder SDK tersedia: $androidHome"
}
elseif ([string]::IsNullOrWhiteSpace($androidHome)) {
    Write-Check -Name 'ANDROID_HOME' -Passed $false -Details 'Belum diatur. Arahkan ke folder Android SDK.'
}
else {
    Write-Check -Name 'ANDROID_HOME' -Passed $false -Details "Folder SDK tidak ditemukan: $androidHome"
}

$longPathsEnabled = $false
$longPathsValue = $null
try {
    $fileSystemSettings = Get-ItemProperty -LiteralPath 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem'
    $longPathsValue = $fileSystemSettings.LongPathsEnabled
    $longPathsEnabled = $longPathsValue -eq 1
}
catch {
    $longPathsValue = 'tidak dapat dibaca'
}

$gitLongPathsEnabled = $false
$gitCommand = Get-Command git -ErrorAction SilentlyContinue
if ($null -ne $gitCommand) {
    $gitLongPathsOutput = & git config --system --get core.longpaths 2>$null
    if ($LASTEXITCODE -eq 0 -and "$gitLongPathsOutput".Trim() -eq 'true') {
        $gitLongPathsEnabled = $true
    }
}

$longPathsPassed = $longPathsEnabled -and $gitLongPathsEnabled
Write-Check -Name 'Long path' -Passed $longPathsPassed -Details "Windows LongPathsEnabled=$longPathsValue; git system core.longpaths=$($gitLongPathsEnabled.ToString().ToLowerInvariant()). Aktifkan keduanya lalu restart Windows."

$googleServicesPath = Join-Path $PSScriptRoot '..\android\app\google-services.json'
$googleServicesExists = Test-Path -LiteralPath $googleServicesPath -PathType Leaf
if ($googleServicesExists) {
    Write-Check -Name 'Firebase Android config' -Passed $true -Details 'android\app\google-services.json tersedia.'
}
else {
    Write-Check -Name 'Firebase Android config' -Passed $false -Details 'android\app\google-services.json tidak ditemukan. Unduh dari Firebase Console; jangan bagikan di grup publik.'
}

if ($script:failureCount -gt 0) {
    Write-Host "`nAda $($script:failureCount) pemeriksaan yang belum benar. Perbaiki item [GAGAL], buka terminal baru, lalu jalankan skrip ini kembali." -ForegroundColor Yellow
    exit 1
}

Write-Host "`nSemua pemeriksaan setup lulus." -ForegroundColor Green
exit 0
