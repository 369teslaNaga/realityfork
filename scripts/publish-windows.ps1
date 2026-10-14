# RealityFork — one-run Windows publisher for the verified GitHub owner.
# Open source source-only automation. It never reads or asks for GitHub tokens.
# The user chooses to run this file and signs in through official GitHub CLI.
$ErrorActionPreference = 'Stop'
$Owner = '369teslaNaga'
$Name = 'realityfork'
$Repo = "$Owner/$Name"
$Folder = Split-Path -Parent $PSScriptRoot
$Description = 'Film motion. Change gravity, time, bounce and wind. Compare alternate 2D physics in your browser. Local-first and open source.'

function Fail([string]$Message) { Write-Host "`nERROR: $Message" -ForegroundColor Red; exit 1 }
function EnsureTool([string]$Tool, [string]$Help) {
  if (-not (Get-Command $Tool -ErrorAction SilentlyContinue)) { Fail "$Tool is missing. $Help" }
}
function RequireSuccess([string]$Context) {
  if ($LASTEXITCODE -ne 0) { Fail "$Context failed (exit code $LASTEXITCODE). Nothing else will be changed automatically." }
}

Write-Host "`n==============================================" -ForegroundColor Green
Write-Host " REALITYFORK - PUBLIC GITHUB PUBLISHER" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host "Account: $Owner"
Write-Host "Target:  https://github.com/$Repo"
Write-Host "Visibility: PUBLIC"
Write-Host 'This will create a brand-new GitHub repository and push ALL included source files.'
Write-Host 'It will not modify your two existing projects.'
Write-Host 'If you do not want to publish publicly, close this window now.'

EnsureTool 'git' 'Install Git for Windows from https://git-scm.com/download/win and rerun.'
EnsureTool 'gh' 'Install GitHub CLI with: winget install --id GitHub.cli -e ; then reopen the terminal.'

Push-Location $Folder
try {
  if (-not (Test-Path (Join-Path $Folder 'index.html'))) { Fail 'This script must run inside the extracted RealityFork project folder.' }
  if (-not (Test-Path (Join-Path $Folder 'package.json'))) { Fail 'Cannot find package.json. Extract the entire archive, not a single file.' }

  Write-Host "`n[1/5] Checking GitHub CLI sign-in..."
  & gh auth status 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'You will be asked to sign in using the official GitHub CLI (browser authentication).'
    & gh auth login --hostname github.com --git-protocol https --web
    RequireSuccess 'GitHub login'
  }
  $Authenticated = (& gh api user --jq '.login' 2>$null)
  RequireSuccess 'Authenticated GitHub account lookup'
  $Authenticated = ("$Authenticated").Trim()
  if ($Authenticated -ne $Owner) { Fail "Signed in as '$Authenticated', expected '$Owner'. Use: gh auth switch -u $Owner" }

  Write-Host "`n[2/5] Checking that target repository does not exist..."
  # Do not overwrite or modify an existing repository, even one with the same name.
  & gh repo view $Repo --json name --jq '.name' 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { Fail "Repository $Repo already exists. This publisher only creates NEW repositories." }

  Write-Host "`n[3/5] Preparing local Git repository..."
  if (Test-Path '.git') { Fail 'This folder already contains .git. Use a clean copy of the release ZIP to avoid altering a separate project.' }
  $GitName = (& git config --get user.name 2>$null)
  $GitEmail = (& git config --get user.email 2>$null)
  if ([string]::IsNullOrWhiteSpace("$GitName") -or [string]::IsNullOrWhiteSpace("$GitEmail")) {
    Fail 'Git identity missing. Set it in Terminal: git config --global user.name "Your Name" ; git config --global user.email "Your GitHub Email". Then rerun.'
  }
  & git init -b main
  RequireSuccess 'git init'
  & git add -A
  RequireSuccess 'git add'
  & git commit -m 'Launch RealityFork v1.0.0-beta.1 - open-source physics lab'
  RequireSuccess 'git commit'

  Write-Host "`n[4/5] Creating PUBLIC repository and pushing full source..." -ForegroundColor Green
  & gh repo create $Repo --public --source=. --remote=origin --push --description $Description
  RequireSuccess 'gh repo create and git push'

  Write-Host "`n[5/5] Trying to turn on GitHub Pages (Actions source)..."
  # Optional: the user's token may not include Pages administration permission.
  & gh api --method POST "repos/$Repo/pages" -f build_type=workflow 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host 'GitHub Pages is configured for GitHub Actions.' -ForegroundColor Green
    Write-Host "Verify the real URL in the repository's Actions -> Deploy GitHub Pages run."
  } else {
    Write-Host 'Pages was not automatically enabled. Manually choose Settings -> Pages -> GitHub Actions.' -ForegroundColor Yellow
  }
  Write-Host "`nSUCCESS: https://github.com/$Repo" -ForegroundColor Green
  Write-Host 'NEXT: Add assets/social-preview.png under repository Settings -> General -> Social preview.'
  Write-Host 'NEXT: Create a pre-release with tag v1.0.0-beta.1 after verifying GitHub Actions.'
  Write-Host 'NEXT: Open docs/LAUNCH_COPY.md and fill only real, verified URLs.'
} finally { Pop-Location }
