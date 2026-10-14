# RealityFork v1.0.0-beta.1 — Initial Open-Source Release

**Change the laws. Fork reality.**

## Additional publishing convenience

Includes a Windows `.cmd` launcher and safety-checked PowerShell publishing script targeting the verified GitHub username `369teslaNaga`. Requires local GitHub CLI login and will create a brand-new **public** repository; no external repository has been created by the archive itself.

## Highlights

Six interactive beta modules are implemented: GravityFork, TimeFork, MaterialFork, WindFork, MotionDNA and RealityShare. The fully local browser demo includes synthetic Earth versus Moon comparisons, customizable bounce, drag and horizontal forcing, experimental user-video RGB tracking, optional point marking and a motion chart.

Exports: Reality Card PNG, browser-dependent 5-second WebM (derived data only), source-independent reproducible experiment JSON, CSV and settings-only share link. The archive includes a 15-second **synthetic-labeled** teaser, repository social-preview artwork, test fixture, zero-dependency source, GitHub workflows and launch instructions.

## Verification at packaging time

- `npm run check` — successful.
- `npm test` — 20 of 20 passed.
- `python tests/browser_smoke.py` — desktop/mobile six-mode interactions, PNG/JSON download, JSON import, no sideways scrolling or JavaScript errors; local synthetic video 46/48 frames detected and CSV downloaded.
- Local Chromium MediaRecorder test — 5-second WebM download completed and decoded successfully with FFmpeg.

The browser smoke harness loads local JS modules inline because its sandbox disallows navigating to `localhost`, `file://` or external URLs. Publishing to GitHub Pages and testing the live HTTP site is a separate maintainer task.

## Known limitations

Simple RGB tracker only, experimental user-footage inference; 2D motion; no AI pose estimator, general 3D world reconstruction, corrected perspective or validated physics accuracy for real clips. Playback encoding is browser-dependent. The public repository/demo URLs are not populated until the owner publishes them.

## Next

Calibration wizard, editable trace correction, optical robustness and open ground-truth benchmark clips. See docs/ROADMAP.md.
