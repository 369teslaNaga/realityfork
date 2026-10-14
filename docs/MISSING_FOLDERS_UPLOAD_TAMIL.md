# RealityFork: Complete GitHub Sync (Tamil)

GitHub-ல் தற்போது top-level files மட்டும் upload ஆகியிருந்தால், src, assets, docs, tests, scripts, .github folders விடுபட்டிருக்கலாம்.

## Recommended — one-click Windows upload

1. `RealityFork_GitHub_Complete_Sync_v1.0-beta.zip`-ஐ Extract செய்யவும்.
2. உள்ளே `realityfork` folder-ஐத் திறக்கவும்.
3. `Sync-RealityFork-ExistingRepo.cmd`-ஐ double-click செய்யவும்.
4. தேவையானால் `gh auth login` மூலம் GitHub-ல் login செய்யவும் (GitHub CLI மற்றும் Git for Windows தேவை).
5. Script உங்கள் account 369teslaNaga என்பதைச் சரிபார்த்து, இருக்கும் public realityfork repo-ஐ clone செய்து, எல்லா nested folders-ஐயும் copy செய்து **force-push இல்லாமல்** commit செய்யும்.
6. GitHub-ல் `src/`, `assets/`, `docs/`, `tests/`, `scripts/`, `.github/` இருப்பதை உறுதிப்படுத்தவும்.

**Important:** பழைய `Publish-RealityFork-Windows.cmd` script புதிய repo உருவாக்குவதற்கானது. இப்போது repo இருக்கிறது; அதை பயன்படுத்த வேண்டாம். **Sync-RealityFork-ExistingRepo.cmd** மட்டும் பயன்படுத்தவும்.

## Alternative — GitHub website

Repo → Add file → Upload files → Windows File Explorer-லிருந்து extracted `realityfork` folder-க்குள் உள்ள **all files and six nested folders**-ஐ drag/drop செய்யவும். `.github` hidden folder கூட upload செய்யப்பட வேண்டும். பின்னர் `Commit changes` செய்யவும். Folder drag/drop browser support வேறுபடலாம்; அந்தக் காரணத்திற்காக one-click CLI sync பரிந்துரைக்கப்படுகிறது.

## Enable website

Repository → Settings → Pages → Build and deployment → Source → GitHub Actions. Actions tab-ல் `Deploy GitHub Pages` successful ஆன பிறகு public site URL கிடைக்கும்.
