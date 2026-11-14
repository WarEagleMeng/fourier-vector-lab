# User guide

## First session

Open the Local URL from the development server, or the published GitHub Pages URL. The app needs no student account. The opening banner and Guide button explain the main workflow. Use Glossary for terms and About for the educational context. Theme/intro preferences alone are stored in browser local storage; images and audio do not leave the browser.

## Drawing Studio

1. Choose Heart, Circle, Square, Star or Portrait. The portrait is a simple original silhouette, not a reproduction of the lecture's animated Fourier portrait.
2. Move **Harmonic order** to 0. Only c0 remains. Raise it toward 12, 30 and 100. The symmetric range is −N…+N, with 2N+1 available coefficients including DC.
3. Press **Evolve from N=0** to increase automatically up to the currently selected maximum. **Pause order evolution** stops at the current order. After pausing, the next evolution uses the new current order as its maximum.
4. Under **Coefficient order**, choose individual progression to add DC,+1,−1,… one coefficient at a time. **Compare N=1,5,20** overlays complete fixed-order reconstructions.
5. Pause/play, restart, step ±1/512 period, change speed and loop. Layer checkboxes independently control vectors/circles/contours/trace/grid and the inspected harmonic drawn from the origin. At speed 1× a cycle takes eight seconds.
6. Click a spectral line or use **Selected harmonic**. Inspect its signed index, nω0, coefficient, magnitude and phase. Disable it to connect the change in shape with omitted energy. Zero-magnitude phase is undefined.
7. Error is measured against the final 512 resampled contour points. The error/order graph assumes full paired sets; numeric metrics use the terms currently enabled.

### Upload an image

Upload or drag/drop PNG, JPEG or WebP under 20 MB. Start with a dark shape on a white background. The image is downscaled to 320 pixels on its longest side, composited on white, converted to luminance and thresholded. Adjust **Threshold**, or choose **Light foreground** to invert the decision. The original image appears with the selected ordered boundary overlaid in green. Select another contour when there are disconnected objects or holes. The longest boundary is initially selected. If segmentation fails, trace the desired outline over the image manually.

SVG import samples path geometry locally. Use one subpath per path element. Convert shapes and text to paths and flatten transforms in your vector editor. Open SVG paths are closed by a final line. Embedded scripts/resources are not executed or inserted.

### Draw or trace

Press **Draw your own path** (or **Trace or draw a path** after an image upload). Use a mouse, pen or touch to draw a continuous path. Each new stroke replaces the previous one. **Use closed path** connects last to first and resamples. Escape/Cancel leaves the current experiment unchanged. A short path with at least four input points is required by the interface.

### Export and share

- **SVG / PNG**: the complete reconstructed contour using current enabled terms, fitted to its output viewport; independent of visible layers and current trace time.
- **CSV**: indices −100…100, angular frequency, complex coefficient, magnitude, phase (blank at zero) and whether included in the current enabled set. Coefficients are those of the final processed contour.
- **Save JSON / Load**: points, title, order, speed, smoothing and disabled harmonics. Images, current playback time, layers and comparison settings are not serialized. Loading pauses playback and restores paired mode.
- **Share**: copies a configuration URL for a small experiment. Built-in shapes use exact preset identifiers; other paths must fit the bounded link size. Large paths use JSON instead. Raster image pixels never enter URLs. A person opening the URL can inspect the included contour, so use only drawings you want to share.
- **WebM**: records up to ten seconds of canvas animation, at a target 30 fps. Keep the tab active and the canvas visible. HTML formula/legend overlays and audio are excluded. Stop early with **Stop recording** or wait for automatic download. Requires a working WebM MediaRecorder codec (tested in installed Edge). If no frames arrive the app reports it and does not offer an invalid download. PNG/SVG remain available.

## Other laboratories

**Signal Reconstruction**: choose a real waveform, set its maximum harmonic index and inspect target, partial sum, individual components (first eight indices) and error. The square wave contributes only odd sine harmonics. Use compact form to connect sine/cosine coefficients to magnitude/phase. Custom samples specify one periodic, linearly interpolated real signal.

**Signals as Vectors**: choose real or complex target and basis signals, and set the integration interval in multiples of π. Drag the real/imaginary c controls, watch error energy, and use **Use optimal coefficient** to reach the numerical projection. Whole-period sine/cosine and a nonorthogonal pair are provided. Custom real samples can be applied to either selector. Toggle imaginary plots for complex signals.

**Music Studio**: select a score note and press Play. Current note/chord and the first 0.05 s waveform/FFT update. Toggle melody or chords independently; changing voices stops the current schedule. Stop cancels all remaining sources. The source's chord label D7* is preserved but its actual pitches form D major. Device output volume is controlled by your computer.

Switching lab tabs resets transient lab state; save a drawing as JSON before leaving it. Each lab has a reset control; browser reload resets unsaved experiment state while retaining theme and dismissed-intro preference.

## Classroom presentation and keyboard

**Present** enlarges the drawing and keeps its analysis visible. **Fullscreen** expands just the animation and playback controls; press the same icon or the browser's Escape shortcut to leave. Side panels collapse with chevrons. Tablet layouts stack analysis beneath the drawing; phones put the animation first.

When focus is outside an input, select, textarea or button:

| Key | Action |
| --- | --- |
| Space | Drawing play/pause |
| Left/Right | Drawing step backward/forward |
| R | Drawing restart |
| P | Toggle presentation |
| T | Toggle theme |
| ? | Open guide |

Tab moves through controls, Enter/Space activates buttons, and Enter/Space inspects focused spectral lines. Dialogs support Escape and keep Tab focus inside their buttons.

## Guided activities

1. **DC and geometry:** At N=0, what position remains? Is it the filled region's centroid or the time mean of the boundary? Translate a loaded contour and inspect c0.
2. **Signed frequency:** Compare a circle with a reflected/reversed custom path. Why can one rotating exponential suffice? Which sign reverses the rotation?
3. **Removing a coordinate:** Disable the largest non-DC coefficient. Predict the MSE increase from its squared magnitude, then verify.
4. **Convergence:** Compare N=1,5,20 and the error graph. Does aggregate error decreasing force pointwise improvement everywhere?
5. **Orthogonality:** Project sin(t) onto cos(t) over [0,2π]. Shorten the interval. Why does the coefficient change?
6. **Pythagoras:** At the optimal c, compare E_x with E_cg+E_error. Move c away and identify the cross term that is no longer zero.
7. **Gibbs:** In the square-wave lab, raise N while examining a jump. What narrows, and what persists?
8. **Music:** Mute the melody. Are the remaining peaks necessarily harmonics of the melody fundamental? Compare note pitches with integer multiples before deciding.
