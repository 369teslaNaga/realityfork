# REALITYFORK — sync ALL project files to an EXISTING public GitHub repository.
# This script never deletes the existing repository and never force-pushes.
# Usage: double-click Sync-RealityFork-ExistingRepo.cmd in the extracted realityfork folder.
$ErrorActionPreference = 'Stop'
$Owner = '369teslaNaga'
$RepoName = 'realityfork'
$Repository = "$Owner/$RepoName"
$Source = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$Checkout = Join-Path ([System.IO.Path]::GetTempPath()) ("realityfork-sync-" + [guid]::NewGuid().ToString('N'))

function Abort([string]$Why) {
  Write-Host "`nERROR: $Why" -ForegroundColor Red
  exit 1
}
function Needs([string]$Name, [string]$InstallHint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) { Abort "$Name is missing. $InstallHint" }
}
function Run([string]$Context, [string]$Exe, [string[]]$Arguments) {
  & $Exe @Arguments
  if ($LASTEXITCODE -ne 0) { Abort "$Context failed, exit code $LASTEXITCODE" }
}

Write-Host '===============================================' -ForegroundColor Cyan
Write-Host ' REALITYFORK - COMPLETE GITHUB SOURCE SYNC' -ForegroundColor Cyan
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host "Account: $Owner"
Write-Host "Existing repository: https://github.com/$Repository"
Write-Host 'Action: safely add/update missing source files on main (NO force-push).'
Write-Host "Local source: $Source"

foreach($File in @('index.html','package.json','src/main.js','src/engine.js','src/tracker.js','tests/engine.test.mjs','.github/workflows/pages.yml')) {
  if (-not (Test-Path -LiteralPath (Join-Path $Source $File))) {
    Abort "Missing project file $File. Extract the ENTIRE ZIP before running this script."
  }
}
Needs 'git' 'Install Git for Windows: https://git-scm.com/downloads/win'
Needs 'gh' 'Install GitHub CLI: https://cli.github.com/'
Needs 'robocopy' 'This script requires standard Windows Robocopy.'

Write-Host "`n[1/6] Checking official GitHub login..." -ForegroundColor Cyan
& gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Authenticate in your browser when GitHub CLI asks.'
  Run 'GitHub sign-in' 'gh' @('auth','login','--hostname','github.com','--git-protocol','https','--web')
}
$Who = (& gh api user --jq '.login')
if ($LASTEXITCODE -ne 0) { Abort 'Cannot read your authenticated GitHub login.' }
if (("$Who").Trim() -ne $Owner) {
  Abort "Signed in as '$Who' but expected '$Owner'. Run: gh auth switch -u $Owner"
}
Run 'Git credential configuration' 'gh' @('auth','setup-git')

Write-Host "`n[2/6] Confirming repository exists..." -ForegroundColor Cyan
$RepoVisibility = (& gh repo view $Repository --json visibility --jq '.visibility')
if ($LASTEXITCODE -ne 0) { Abort 'Repository does not exist, or GitHub access is denied.' }
if (("$RepoVisibility").Trim() -ne 'PUBLIC') {
  Abort 'Repository is not PUBLIC. Publishing stopped for safety.'
}

Write-Host "`n[3/6] Cloning existing main branch..." -ForegroundColor Cyan
Run 'Repository clone' 'gh' @('repo','clone',$Repository,$Checkout)
$Branch = (& git -C $Checkout branch --show-current)
if ($LASTEXITCODE -ne 0 -or ("$Branch").Trim() -ne 'main') {
  Abort "Unexpected default branch '$Branch'. Refusing to modify any other branch."
}

Write-Host "`n[4/6] Copying full project (including hidden .github)..." -ForegroundColor Cyan
& robocopy $Source $Checkout /E /XD '.git' 'node_modules' '__pycache__' '.cache' 'dist' /XF '*.pyc' '*.log' /NFL /NDL /NJH /NJS /NP
if ($LASTEXITCODE -gt 7) { Abort "Robocopy failed, exit code $LASTEXITCODE" }
Run 'Git staging' 'git' @('-C',$Checkout,'add','--all')
$Changed = (& git -C $Checkout status --porcelain)
if ($LASTEXITCODE -ne 0) { Abort 'Cannot read Git status.' }
if (-not $Changed) {
  Write-Host 'All source files are already up to date.' -ForegroundColor Green
} else {
  Write-Host "`n[5/6] Committing and pushing without rewriting history..." -ForegroundColor Cyan
  $Name = (& git -C $Checkout config user.name)
  $Email = (& git -C $Checkout config user.email)
  if (-not $Name) { Run 'Local Git author name' 'git' @('-C',$Checkout,'config','user.name',$Owner) }
  if (-not $Email) { Run 'Local Git author email' 'git' @('-C',$Checkout,'config','user.email','208589070+369teslaNaga@users.noreply.github.com') }
  Run 'Commit full source' 'git' @('-C',$Checkout,'commit','-m','Add all RealityFork physics modules, tests, assets, docs and GitHub workflows')
  Run 'Fast-forward push to main' 'git' @('-C',$Checkout,'push','origin','main')
}

Write-Host "`n[6/6] Checking repository content..." -ForegroundColor Cyan
$TreeCount = (& gh api "repos/$Repository/git/trees/main?recursive=1" --jq '.tree | length')
if ($LASTEXITCODE -eq 0) { Write-Host "GitHub tree entries: $TreeCount" -ForegroundColor Green }
Write-Host "`nSUCCESS - Source sync completed: https://github.com/$Repository" -ForegroundColor Green
Write-Host 'NEXT: Open Settings > Pages > Build and deployment > Source: GitHub Actions.'
Write-Host 'NEXT: Check the Actions tab for Verify and Deploy GitHub Pages workflows.'
Write-Host 'The repository remains PUBLIC. No other GitHub repositories were changed.'
Write-Host "Temporary local Git checkout: $Checkout"
