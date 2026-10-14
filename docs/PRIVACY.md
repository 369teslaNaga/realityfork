# Privacy contract

**RealityFork deliberately does not upload your video or run server analytics.**

Local demo: source clips are decoded from a browser `blob:` URL. The app samples the pixels locally and produces derived coordinates. The optional Node server is only a static file server.

Exports initiated by the user:

- **PNG Reality Card:** an image of both visible canvases at the chosen moment. If a personal video is visible in the source panel, **the card can include that frame**. Inspect before sharing.
- **WebM preview:** simulated / derived trajectory animation. The original footage pixels are **not** included.
- **JSON:** simulation settings and derived tracked coordinates; no raw video data, filename or file path.
- **CSV:** derived coordinates and derivatives for the observed track.
- **Share link:** hash contains settings and active mode only. **No video or observed track.**

We do not offer a built-in hosting or social-media posting service. When you share a saved file using other apps, their terms and privacy policies apply.

The current beta stores no observations in cookies or persistent local storage. Refreshing the page removes the imported/observed trace unless you exported it.

This is a design-level privacy statement. Browser vendors and extensions are outside our control. Contributors must not add analytics, telemetry, advertising or remote file transfer without an explicit policy and user-facing consent design.
