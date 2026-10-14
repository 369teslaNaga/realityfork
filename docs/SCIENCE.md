# Physics model, coordinate conventions and limitations

This file is a frank description of the experimental 2D model. It is **not** a claim of general physics inference from arbitrary footage.

## Model

The synthetic world uses coordinates `(x, y)` in metres (in the illustrative world) with `y` increasing downwards. Simulation runs at fixed `Δt = 1/120 second`, with semi-implicit Euler integration. Each step:

- `a_x = wind - drag * v_x`
- `a_y = 9.81 * gravityMultiplier - drag * v_y`
- `v_x ← v_x + a_x * Δt`, `v_y ← v_y + a_y * Δt`
- `x ← x + v_x * Δt`, `y ← y + v_y * Δt`

`wind` is **horizontal acceleration in m/s²**, not measured air speed; `drag` is a **linear damping rate in s⁻¹**. This is not computational fluid dynamics; it is only a stable qualitative model for an educational experiment.

At the floor, if descending, vertical velocity is flipped with coefficient of restitution `e` (`v_y_after = -e * v_y_before`), until very small bounces settle (`|v_y * e| < 0.38`). Horizontal walls have an illustrative restitution factor 0.86. No rolling friction, collision rotation, spin or 3D dynamics are modeled.

Gravity ratio reference presets (approximately): Earth 1, Moon 0.165, Mars 0.38, Jupiter 2.53. Jupiter has no Earthlike solid landing surface; it is included only as a reference acceleration.

## What is *measured*?

- **Synthetic sample:** neither panel is from a camera; the left panel is a deterministic baseline 2D Earth simulation and the right panel is a modified model.
- **User video:** the left panel shows user-supplied local video frames and a derived normalized `(x, y, t)` observation trace. The user selects a color; a downsampled local RGB tracker searches nearby pixels over 48 frames (up to 7 seconds).
- **Manual points:** the user can pause, click an object and add frame-associated points; these are manually observed pixel locations, not inferred object centers guaranteed by the app.
- **Calibration:** adding pixels-per-metre assumes a known reference measured in the plane of motion, a stationary camera and negligible perspective error. Actual 3D reconstruction is not possible from single-view position traces alone.

Velocity is computed by finite differences of sampled positions; acceleration is the finite difference of velocity. Such estimates amplify pixel jitter and uneven frame timestamps. They are **rough exploratory estimates**, not metrological-grade instruments. In uncalibrated mode, observations are frame fractions and their time derivatives, *not* metres, m/s or m/s².

The right panel uses an initial condition estimated from tracked normalized video points, projected into a normalized 2D model world. This is illustrative. Even with a reference scale, missing launch parameters, camera projection and interaction effects limit credibility.

## Scientific boundaries

The project does **not** do arbitrary 3D scene reconstruction, AI object recognition, calibrated camera pose estimation, free-body force identification, footage synthesis, inverse graphics, collision surface identification or guaranteed real-world predictions. The WebM video export displays a replay of **derived trajectories**, not retouched real video frames.

## Validation

- Basic unit tests cover deterministic time integration, zero-gravity velocity, drag, horizontal wind, first-impact restitution and inelastic impacts.
- Integration smoke test checks controls and a synthetic red-ball video (not physical ground truth).
- Planned: reference footage with an external ground-truth calibration rig and quantitative trajectory error metrics.

Open an issue with a reproducible numerical test if you observe a physically implausible output.
