# Publish RealityFork on GitHub — exact sequence

## Target owner and name

The connected GitHub account has been verified as **`369teslaNaga`**. The target is **`369teslaNaga/realityfork`**, if still available. The archive does not itself create or publish this repository.

**Fastest Windows option:** extract the ZIP and double-click `Publish-RealityFork-Windows.cmd`. It requires Git for Windows, the official `gh` CLI and a browser-based GitHub CLI sign-in. It refuses to overwrite existing repositories, verifies the connected login, creates a new public repo, pushes all source files, and attempts GitHub Pages setup. This tool cannot execute on the user’s desktop automatically.

Official GitHub CLI docs: https://cli.github.com/manual/gh_repo_create

## Create the repository

1. GitHub → New repository → Name `realityfork` → **Public**.
2. Do **not** initialize the remote with a new README/license; files exist in this project.
3. Open a terminal inside the extracted `realityfork` folder:

```bash
git init
git add .
git commit -m "Launch RealityFork experimental open-source beta"
git branch -M main
git remote add origin https://github.com/369teslaNaga/realityfork.git
git push -u origin main
```

These manual commands target the verified owner `369teslaNaga`. If you choose another owner, change the remote URL to match.

## Turn on GitHub Pages

Repository Settings → Pages → Build and deployment → Source → **GitHub Actions**. The preconfigured `.github/workflows/pages.yml` will deploy from `main`. Once the workflow succeeds, get the **actual** page URL from the workflow's environment. Do not claim it's live before this step.

## Set About and first impression

- **Description:** Film motion. Change gravity, time, bounce and wind. Compare alternate 2D physics in your browser. Local-first and open source.
- **Website:** use your real GitHub Pages URL only after it is published.
- **Topics:** `physics`, `simulation`, `video-analysis`, `javascript`, `counterfactual`, `open-source`, `local-first`, `motion-tracking`, `science`, `education`
- **Social preview:** Settings → General → Social preview → Upload `assets/social-preview.png`. GitHub recommends a PNG/JPG under 1 MB and at least 640×320 (1280×640 preferred).
- **Version:** Create a prerelease tagged `v1.0.0-beta.1`, because arbitrary-video measurements and codec support are experimental.

## Quality gate

```bash
npm run check
npm test
npm run dev
```

Open the local page; test all six modes, JSON → import, PNG and a short video. After deployment test the actual GitHub Pages URL on a desktop and a phone. Confirm no broken resources in DevTools.

## Ethical public launch

1. Shoot a **real** high-contrast ball clip and explicitly say the fork is a *model*, not edited video.
2. Show the 10-second flow: Earth baseline → Moon preset → material / wind → PNG export.
3. Post the repo + live demo + one 15-sec screen recording in English, linking a clear set of limitations.
4. Share to relevant developer / science communities and follow community rules. Avoid vote manipulation, bulk spam, fake stars or unsupported “world's first” claims.
5. Invite contributors to test on their own browsers and file reproducible issues with no personal footage.

### Rollback

If the demo has an error, pause the Pages workflow, fix the repository, test and release a patch instead of describing broken functionality as finished.
