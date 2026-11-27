$ErrorActionPreference = 'Stop'

$game = Join-Path $PSScriptRoot 'dist/whisker-beacon.prg'
if (-not (Test-Path -LiteralPath $game -PathType Leaf)) {
    throw "The bundled game is missing: $game"
}

$release = 'GTK3VICE-3.10-win64'
$cache = Join-Path $env:LOCALAPPDATA 'WhiskerBeacon/VICE-3.10'
$install = Join-Path $cache $release
$cachedExe = Join-Path $install 'bin/x64sc.exe'

if ($env:VICE_BIN) {
    $viceExe = (Get-Command -Name $env:VICE_BIN -CommandType Application |
        Select-Object -First 1).Source
} elseif (Test-Path -LiteralPath $cachedExe -PathType Leaf) {
    $viceExe = $cachedExe
} else {
    $vice = Get-Command -Name 'x64sc.exe' -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if ($vice) {
        $viceExe = $vice.Source
    } else {
        Write-Host 'Downloading VICE 3.10 for Windows...'
        $staging = Join-Path $cache ([Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $staging -Force | Out-Null
        try {
            $zip = Join-Path $staging "$release.zip"
            $url = "https://github.com/VICE-Team/svn-mirror/releases/download/3.10.0/$release.zip"
            $expectedHash = 'beb3791d90e98f7e012c0028f26fbaa6545c8fce676f852a67f8ad893dee9d08'
            $previousProtocol = [Net.ServicePointManager]::SecurityProtocol
            try {
                [Net.ServicePointManager]::SecurityProtocol = $previousProtocol -bor [Net.SecurityProtocolType]::Tls12
                Invoke-WebRequest -Uri $url -UseBasicParsing -OutFile $zip
            } finally {
                [Net.ServicePointManager]::SecurityProtocol = $previousProtocol
            }

            if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash -ne $expectedHash) {
                throw 'The VICE download failed its SHA-256 check. Run the launcher again to retry.'
            }

            Expand-Archive -LiteralPath $zip -DestinationPath $staging
            $unpacked = Join-Path $staging $release
            if (-not (Test-Path -LiteralPath (Join-Path $unpacked 'bin/x64sc.exe') -PathType Leaf)) {
                throw 'The VICE archive did not contain x64sc.exe.'
            }

            # Move the completed install into place. A concurrent launch may have done so already.
            try {
                [IO.Directory]::Move($unpacked, $install)
            } catch {
                if (-not (Test-Path -LiteralPath $cachedExe -PathType Leaf)) {
                    throw
                }
            }
        } finally {
            Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
        }

        $viceExe = $cachedExe
    }
}

& $viceExe -autostartprgmode 1 -autostart $game
