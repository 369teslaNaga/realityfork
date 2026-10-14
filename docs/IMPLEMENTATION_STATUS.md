# Implementation status — v1.0.0-beta.1

This release is a **new public-repository-ready source archive**, not yet published on any external GitHub account.

Implemented: GravityFork, TimeFork, MaterialFork, WindFork, MotionDNA (calculation and local RGB tracker), RealityShare (PNG, JSON roundtrip, CSV, settings URL, browser-dependent WebM), responsive design, privacy documentation and CI/Pages workflow.

Automated validation: `npm run check` and `npm test` cover pure modules. The optional Chromium smoke test in `tests/browser_smoke.py` bundles ES modules for the test runtime and checks UI behavior without network navigation. It verifies a synthetic test video in Chromium; this is not a scientific accuracy benchmark.

Important follow-ups before widely advertising: test the real deployed public URL, test WebM across browsers, validate real footage with separate consented clips, and review licenses/branding and GitHub social preview upload. If any public claims suggest arbitrary-video 3D reconstruction, edit them first.
