# RealityFork — Codex / general coding agent instructions

Read README.md, docs/SCIENCE.md and docs/FEATURE_STATUS.md first. You are contributing to an existing **working** local-first static browser lab. Do not replace it with a mockup, unrelated boilerplate, paid API integration, hosted data pipeline, or untestable marketing claims.

Non-negotiable:
- Keep all source video bytes and color tracking in the user's browser; never add remote uploads/analytics.
- Preserve semantic distinction between **observed pixel data** and **simulated counterfactual outcomes**.
- Preserve deterministic fixed-step physics or explain/test any new integrator.
- Keep all six modes operational; add regressions/tests when modifying core behavior.
- Changes to schema v1 require tests; a breaking change requires migration strategy.
- Keep GitHub Pages static hosting working and mobile UI no horizontal overflow.
- State precisely which tests ran and which limitations remain.

Run `npm run check && npm test` after code changes. Where available run `python tests/browser_smoke.py` (optional Python Playwright + local Chromium). Test real deployed HTTP modules separately when publishing; the inline browser test alone is insufficient.

Useful jobs: robust video tracker, controlled camera calibration, measurement uncertainty, keyboard accessibility, multi-browser validation, reproducible physics fixtures, community contributions.
