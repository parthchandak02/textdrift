# Toolcraft App Agent Worklog

## Status

Mode: product

Textdrift is a typographic weather poster: your words set large and pushed downwind by the live wind with fading trails, coloured from the air temperature to the feels-like temperature, crossed by rain when it falls, with the current conditions below. Detailed requests and results belong in `docs/agent-journal/changes`; command attempts live in `.toolcraft/journal/runs`.

Active change: textdrift-rebuild-0026

## Decision Trail

### Change textdrift-rebuild-0026 — Rebuild Textdrift on Toolcraft 0.0.26 with a new design

- Change ID: textdrift-rebuild-0026
- Request: "Yes do it for those and all others to make it consistent and the sites are too old and not well designed so we want to avoid that in the future make it much better ok?" The user then chose: all seven Toolcraft apps; each keeps its own look; rethink freely; no check-ins.
- Task type: Generated app porting plus substantial product redesign (renderer, data, controls, export).
- User-visible result: Instead of letters floating in an animation tied to Singapore, Textdrift now makes a still poster for any of eight cities or any place: each letter is pushed downwind in proportion to the wind speed (later letters further), jostled across the wind by gusts, tilted, and followed by a six-step fading trail; colour runs from the temperature to the feels-like temperature; rain streaks lean with the wind when it rains. A header names the place and local time and a row of figures gives temperature (with a colour chip), wind, rain, humidity and cloud.
- Source/reference checked: The previous Textdrift (github.com/parthchandak02/textdrift, Toolcraft template from July 2026); the Open-Meteo forecast API current conditions; earlier 0.0.26 rebuilds for wiring.
- Reference inputs: None (no motion, video, Figma or screenshot reference).
- Docs/contracts read: AGENTS.md, workflow.md, core/runtime-boundary.md, assembly-workflow.md, core/control-selection.md, core/layout.md, core/performance.md, core/setup-export.md, core/media-upload.md, core/development-files.md, core/app-cover.md, core/slider-ranges.md, decision-contract.md, schema-reference.md, component-rules.md (text controls are single-line; a label may not repeat its section title), renderer-technique.md, performance.md, acceptance-testing.md.
- Contract rules applied: runtime-shell-required, canvas-no-app-ui, canvas-surface-preserved, infinity-canvas-scene-bounds (intrinsic bounds; drawing is clipped to the frame and letters are kept inside it), output-export-required (image only), controls-section-inventory-required, acceptance-product-observable, persistence-policy-explicit (default local persistence).
- View interaction intent: non-spatial; a flat poster.
- Interaction ownership: panel only; text, latitude, longitude, typeface, drift and background are global property edits, cities are panel commands.
- Decision: Replace animation with a still poster where weather is legible in the type; derive every displacement from wind speed, direction and gusts with a seeded random per text so the same words and weather always give the same poster; default to Wellington, a windy city, so the first view shows the effect.
- Alternatives rejected: Keeping animation (needs autonomous-animation proof and adds nothing to a still export); blur for humidity (canvas filters are not portable to the worker export path); letting letters leave the poster in strong wind (breaks intrinsic scene bounds).
- State/output mapping: `words.text` (up to 40 characters) sets the letters; `place.latitude` and `place.longitude` choose the weather and trigger a cached load; `place.city` sets both sliders; `type.face` picks serif, sans or mono; `type.drift` scales how far the wind moves the letters; `appearance.background` sets the runtime background and flips the ink for dark colours; `export.includeBackground` removes the runtime fill; `canvas.size.*`, `canvas.renderScale` and `canvas.zoom` set the worker raster backing; the runtime image export calls the same `drawTextdrift` after loading the same weather.
- Verification: Unit tests in `src/textdrift/textdrift.test.ts` (19 passed: request, parsing, offline sample, temperature colours, compass and downwind vectors, rain only when it rains, stronger wind pushing further, every control). 14 product browser specs passed with a deterministic Open-Meteo stub. Agent screenshots of London (calm) and Wellington (27 km/h, Mono) with live data inspected. The first-delivery gate result is recorded by its protected receipt.
- Risks: See Risks.

## Decisions

### Renderer

- Decision: Canvas 2D in a worker through one `raster` pipeline pass; export reuses `drawTextdrift`.
- Reason: At most 280 glyph fills plus rain lines; one drawing function keeps preview and export identical.
- Evidence: `src/textdrift/textdrift-pipeline.ts`, `src/textdrift/TextdriftCanvas.tsx`, `src/textdrift/textdrift-export.ts`; `browser: textdrift backing preserves selected render scale`.

### View Interaction

- Decision: Mode `non-spatial`.
- Reason: The poster is flat.
- Evidence: `src/textdrift/textdrift-inventory.ts`.

### Interaction Ownership

- Decision: Panel only, eight entries.
- Reason: Every input is a global value or shortcut.
- Evidence: `src/textdrift/textdrift-inventory.ts` `interactionOwnership`.

### Timeline

- Decision: No timeline.
- Reason: A still poster; video was not requested.
- Evidence: No timeline module; `animationIntent: none`.

### Layers

- Decision: No layers.
- Reason: No layer workflow was requested.
- Evidence: No layers module.

### Controls

- Decision: Settings (runtime background), Words (Text), Place (Cities, Latitude, Longitude), Type (Typeface, Drift), Image Export (runtime).
- Reason: What is written, where its weather comes from and how it is set are separate choices.
- Evidence: `src/textdrift/textdrift-controls.ts`, `appControlSectionInventory`; browser specs type new words, click every city, choose every typeface and drag every slider while held.

### Export

- Decision: Image export only (PNG/JPG, 2K/4K/8K) via `imageExportModule()` and `scene.rasterFrameRenderer`.
- Reason: Toolcraft default; SVG and video were not requested.
- Evidence: `browser: textdrift image export delivers every format and size` decodes every format and size and checks the temperature chip colour and content bounds.

### Performance

- Decision: Workload envelope from runtime state (canvas width/height, render scale, zoom) plus export resolution; derived paths; adapters stub the API.
- Reason: Text is capped at 40 characters and rain at 420 lines; cost follows the backing size.
- Evidence: `src/textdrift/textdrift-performance-model.ts`; `textdrift render plan has valid derived paths and fixtures`. First delivery runs no measured performance by contract.

Canonical control values and selected-entity isolation follow runtime representations; render scale has functional `renderScaleCoverage` with backing-pixel proof.

## Evidence

- Source reviewed: previous Textdrift, Open-Meteo current weather, earlier 0.0.26 rebuilds.
- Contract applied: product modules under `src/textdrift`, registered browser scenarios in `e2e/product-textdrift-*.spec.ts`, cover at `public/toolcraft/cover.png` with `app-cover.json` and `app-cover-state.json`.

## Verification

Protected receipts own initial proof. Development checks: `src/textdrift/textdrift.test.ts` 19 passed; 14 product browser specs passed (two Playwright workers on the dev server); screenshots inspected. Cover captured with the app's own Export PNG at 4K.

## Risks

- Risk: In calm weather the letters barely move; that is the honest reading, and the Drift slider can exaggerate it up to two times.
- Risk: Canvas fonts depend on the viewer's system; each typeface has fallbacks.
