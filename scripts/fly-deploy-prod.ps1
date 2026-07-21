# One-shot Fly production deploy (run in an interactive terminal)
# Usage: pwsh scripts/fly-deploy-prod.ps1

$ErrorActionPreference = "Stop"
$App = "paywallapp"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "==> Checking Fly auth..."
fly auth whoami
if ($LASTEXITCODE -ne 0) {
  Write-Host "Log in first (browser will open):"
  fly auth login
  fly auth whoami
  if ($LASTEXITCODE -ne 0) { throw "Fly auth failed" }
}

Write-Host "==> Ensuring app exists: $App"
$apps = fly apps list --json 2>$null | ConvertFrom-Json
$exists = $apps | Where-Object { $_.Name -eq $App }
if (-not $exists) {
  fly apps create $App
}

Write-Host "==> Ensuring volume paywall_data..."
$vols = fly volumes list --app $App --json 2>$null | ConvertFrom-Json
if (-not $vols -or $vols.Count -eq 0) {
  fly volumes create paywall_data --app $App --region iad --size 1 --yes
}

Write-Host "==> Syncing secrets from .env (prod URLs)..."
& "$PSScriptRoot\fly-set-secrets.ps1" -App $App

Write-Host "==> Deploying..."
fly deploy --app $App --build-arg "VITE_API_URL=https://$App.fly.dev"

Write-Host ""
Write-Host "Deployed: https://$App.fly.dev"
Write-Host "Set Stripe webhook to: https://$App.fly.dev/api/webhook/stripe"
Write-Host "Health: https://$App.fly.dev/health"
