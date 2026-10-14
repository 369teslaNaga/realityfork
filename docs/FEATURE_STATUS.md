# Honest feature matrix — RealityFork v1.0.0-beta.1

| Capability | Status | Verification |
|---|---|---|
| 2D deterministic fixed-step motion | Implemented | Node automated physics tests |
| Moon/Mars/Earth/Jupiter presets | Implemented | UI + model gravity comparison |
| Slow-motion, play/pause, frame step, scrub | Implemented | Browser smoke test |
| Bounce restitution + illustrative material presets | Implemented | UI + bounce tests |
| Horizontal wind + linear drag | Implemented | UI + acceleration tests |
| Local user video upload (browser-supported codecs) | Experimental | Chromium synthetic fixture |
| RGB target tracking | Experimental | Synthetic high-contrast red ball only |
| Manual frame marking | Implemented | Browser event and data serialization; manual QA recommended |
| Motion chart and optional pixel/metre scale | Implemented | Unit + browser graph tests |
| CSV with tracked observations | Implemented | Unit + browser download tests |
| PNG Reality Card | Implemented | Chromium browser download test |
| JSON export/import and settings-only share hash | Implemented | Node round-trip + browser download tests |
| WebM 5-second local derived-path clip | Experimental | Browser MediaRecorder-dependent; manual browser validation recommended |
| Accurate 3D video-to-simulation from arbitrary camera footage | **Not implemented** | Research project, not in beta |
| AI object recognition / pose estimation | **Not implemented** | Not claimed |
| Public GitHub repository / hosted Pages site | **Not published by this archive** | Maintainer must publish |

The app runs offline *after its static files have been loaded*, and does not use external APIs. Browser codec support and MediaRecorder availability differ by platform.
