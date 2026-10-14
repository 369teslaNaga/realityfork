# RealityFork — தமிழில் முழுமையான Public Launch Guide

## இந்த project என்ன?

RealityFork என்பது ஒரு Open-Source, Local-First Physics Experiment Website. இதன் நோக்கம் நிஜமாகக் கவனித்த இயக்கத்தையும் (observed motion), இயற்பியல் விதிகளை மாற்றிக் கணினி கணிக்கும் இயக்கத்தையும் (counterfactual model) ஒப்பிடுவது. வீடியோவை AI பயன்படுத்தி உண்மையாக மாற்றியதாகத் தவறாகக் கூறக்கூடாது.

## ஆறு அம்சங்கள்

1. **GravityFork:** Earth, Moon, Mars, Jupiter gravitational ratios மற்றும் custom control.
2. **TimeFork:** 0.1×–5× வேகம், pause, frame step, timeline.
3. **MaterialFork:** Bounce coefficient 0–1, மாதிரி material presets.
4. **WindFork:** Horizontal acceleration மற்றும் drag controls.
5. **MotionDNA:** Ball இயக்கத்தை உள்ளூர் browser-ல் track செய்தல், X/Y, speed, acceleration graph, optional reference scale, CSV.
6. **RealityShare:** PNG Reality Card, derived-data 5-second WebM (browser support இருந்தால்), JSON import/export மற்றும் settings-only URL.

## Start செய்வது எப்படி?

ZIP extract செய்யவும். Windows Terminal / VS Code / Codex / Claude Code-ல் `realityfork` folder திறக்கவும்.

```bash
node --version
npm run check
npm test
npm run dev
```

Browser-ல் `http://127.0.0.1:5173` திறக்கவும். இது free website; paid API, MySQL, GPU server எதுவும் தேவையில்லை.

## GitHub Public செய்வது

GitHub-ல் புதிய **Public** repository உருவாக்கவும். Repository பெயர் `realityfork` (பெயர் கிடைத்தால்) என வைக்கவும். Terminal:

```bash
git init
git add .
git commit -m "Launch RealityFork open-source beta"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/realityfork.git
git push -u origin main
```

`YOUR_GITHUB_USERNAME` என்பது உதாரணம்; உங்களுடைய உண்மையான GitHub username-ஆக மாற்றவும்.

Settings → Pages → Source: **GitHub Actions** எனத் தேர்ந்தெடுத்து workflow முடிந்த பின் உண்மையான live URL எடுத்துக் கொள்ளவும். GitHub Settings → General → Social preview-க்கு `assets/social-preview.png` upload செய்யவும். `docs/PUBLIC_RELEASE.md`-ல் விரிவான வழிமுறைகள் உள்ளன.

## இணையத்தில் வெளியிட வேண்டிய தகவல்

**Project:** REALITYFORK

**Tagline:** Change the laws. Fork reality.

**GitHub description:** Film motion. Change gravity, time, bounce and wind. Compare alternate 2D physics in your browser. Local-first and open source.

**Creator credit:** 369 Tesla × Kalviyogi

**Version:** v1.0.0-beta.1

## உண்மையைத் தெளிவாகச் சொல்லவேண்டும்

- முதல் demo ஒரு **synthetic simulation**, நிஜப் படம் அல்ல.
- User Video RGB Tracker இன்னும் experimental; எல்லா வீடியோக்களையும் சரியாகக் கண்டறியாது.
- நிஜ 3D physics reconstruction இல்லை.
- WebM export browser வசதியைப் பொறுத்தது.
- Live GitHub repository / website இன்னும் நிஜமாக upload செய்யும் வரை வெளியிடப்பட்டுள்ளது என்று சொல்லக்கூடாது.
- நாளைக்குள் GitHub stars அல்லது உலக அளவிலான வைரல் வெற்றி உறுதி இல்லை. உண்மையான demo, docs, test evidence வெளியிடுவதே நோக்கம்.

## Codex / Claude Code

`AGENTS.md`, `CLAUDE.md` மற்றும் `docs/NEXT_AGENT_PROMPT.md` சேர்க்கப்பட்டுள்ளன. இவை படித்த பின் புதிய features / bug fixes-ஐ branches-ல் உருவாக்க முடியும். ஒரே source files-ஐ இரு agents ஒரே நேரத்தில் மாற்ற வேண்டாம்.
