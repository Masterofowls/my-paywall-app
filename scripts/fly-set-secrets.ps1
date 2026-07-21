# Sync local .env secrets to Fly (overrides public URLs for production).
# Usage: pwsh scripts/fly-set-secrets.ps1 [-App paywallapp]

param(
  [string]$App = "paywallapp",
  [string]$EnvFile = ".env"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path $EnvFile)) {
  throw "Missing $EnvFile"
}

$appUrl = "https://$App.fly.dev"
$pairs = @{}

Get-Content $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $idx = $line.IndexOf("=")
  if ($idx -lt 1) { return }
  $key = $line.Substring(0, $idx).Trim()
  $value = $line.Substring($idx + 1).Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  $pairs[$key] = $value
}

# Production must use the Fly HTTPS origin (not localhost from .env)
$pairs["BETTER_AUTH_URL"] = $appUrl
$pairs["VITE_API_URL"] = $appUrl
$pairs["DATABASE_URL"] = "/data/local.db"
$pairs["NODE_ENV"] = "production"

$argsList = @("secrets", "set", "--app", $App)
foreach ($key in $pairs.Keys) {
  $argsList += "$key=$($pairs[$key])"
}

Write-Host "Setting secrets on $App (BETTER_AUTH_URL/VITE_API_URL -> $appUrl)"
& fly @argsList
if ($LASTEXITCODE -ne 0) { throw "fly secrets set failed" }
Write-Host "Done."
