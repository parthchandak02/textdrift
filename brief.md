# textdrift — Creative Brief

## Concept
A generative typography instrument. Type any words. Live Singapore weather data (temperature, wind speed, wind direction) animates each letter as a drifting particle floating through a pastel sky. Temperature maps to letter color (cool blue when cold, warm coral when hot). Wind speed and direction control how letters drift. Sliders adjust font size, particle spread, wind multiplier, and color palette. Export your creation as PNG.

**Narrative Pattern:** Annotation — each letter's color, position, and speed annotate the weather data driving them

**Tier 2 Patterns (pick 2):** Hero Number (current temperature 48px) + Quiet Zone (detail panel on tap showing weather values)

**Metaphor family:** atmosphere (weather drives typography drift)

## Data Source
- API endpoint: `https://api.open-meteo.com/v1/forecast?latitude=1.35&longitude=103.82&current=temperature_2m,wind_speed_10m,wind_direction_10m&timezone=Asia/Singapore`
- Response format: `current.temperature_2m` (deg C), `current.wind_speed_10m` (km/h), `current.wind_direction_10m` (deg)
- Poll interval: 60s
- Fallback: temperature 28.0, wind speed 5.0, wind direction 90 (typical Singapore values)

## Visual Style
- **Preset:** Light — Breeze (pastel sky)
- **Why:** Soft, airy palette fits the "letters floating in the wind" metaphor. Light theme breaks the recent dark streak. Pastel blues/pinks/lavender match temperature color encoding naturally.

```js
const PALETTE = {
  bg: '#e8f4f8',         // pale sky blue
  layer: '#d4ecf0',      // slightly deeper for depth
  accent1: '#81d4fa',    // soft blue — cool temperature
  accent2: '#ce93d8',    // soft lavender — mild temperature
  accent3: '#f48fb1',    // soft pink — warm temperature
  accent4: '#fff176',    // pale yellow — highlight
  text: 'rgba(0,0,0,0.5)',
};
```

- **Coherence tokens:** strokeWeight 1-2px, alphaHierarchy {bg:0.08, field:0.35, active:0.7, label:0.5}, shapeLanguage letters (typographic), glowBudget 1 glow color at blur 15px max 15 entities

## Three Dials
- DESIGN_VARIANCE: 6 (offset — semi-random positions, varied letter sizes by temperature)
- MOTION_INTENSITY: 5 (gentle drift — letters float like leaves in warm air, slow oscillation)
- VISUAL_DENSITY: 5 (moderate — 20-80 letters depending on text length)

## Encoding Contract
| Data Field | Visual Channel | Range | Inverse Function | "Bigger means..." | Legend? |
|---|---|---|---|---|---|
| temperature_2m | letter fill color | 22-34°C mapped to hue | invertScale(h, 0,360, 22,34) | warmer temperature (blue->coral) | yes |
| wind_speed_10m | letter drift velocity | 0-15 km/h mapped to 0.3-3.0 px/frame | invertScale(v, 0.3,3.0, 0,15) | stronger wind (letters drift faster) | no (physical) |
| wind_direction_10m | drift angle | 0-360° | N/A (physical direction) | wind blows from this angle | no (physical) |

## Interaction
- **Type in the text input** to change the word(s) being displayed
- **Sliders** control: font size (12-60px), wind multiplier (0-3x), particle spread (0.5-3x), color palette mood (cool/mixed/warm)
- **Tap any letter** to open Quiet Zone showing that letter's weather-driven properties (temp, wind speed/direction)
- **Export button** saves current canvas as PNG
- **Auto-animation:** letters gently drift based on wind data, slow oscillation bobbing

## Communication Requirements
**Tier 1 (mandatory):**
1. Persistent Data Stamp — "Open-Meteo · Singapore · [temp]°C · [wind] km/h · live · Xs ago"
2. Data Process Honesty — fallback labeled "fallback", never "live"
3. One-to-One Sensory Mapping — temperature = color warmth, wind speed = drift speed (both physical metaphors)

**Tier 2 (pick 2):**
4. ✅ Quiet Zone — tap any letter shows: "Letter [char] · [temp]°C drives color · [wind] km/h drives drift"
5. ✅ Hero Number — current temperature displayed at 48px in top-right

**Coherence:**
6. Generative-art axes: single strokeWeight (1px), alphaHierarchy const, one glow color (#ffffff at blur 15px), one accent color family (pastel), 8px grid for chrome
7. Motion tokens: --motion-fast:160ms, --motion-base:240ms, --motion-slow:360ms, --ease-out-expo
8. AI Slop Score < 30: system-ui font family, no white bg (using #e8f4f8), layered bg with gradient, at least 1 animation (letter drift)

## Toolcraft Controls Required
1. Text input field (user types word, letters appear as particles)
2. Slider: font size (12-60px, default 32px)
3. Slider: wind multiplier (0-3x, default 1x)  
4. Slider: particle spread (0.5-3x, default 1x)
5. Color mood toggle: cool / mixed / warm (changes palette interpolation)
6. Export button ("Save as PNG")
7. Reset button (reset sliders to defaults)

## Canvas Code Requirements (MANDATORY)
1. Single-page React + Canvas app using Toolcraft starter kit patterns
2. Config object at top with all tunable values
3. DPR-aware canvas: `Math.min(window.devicePixelRatio || 1, 2)`, `ctx.setTransform(dpr,0,0,dpr,0,0)`
4. Canvas CSS: `position:fixed;top:0;left:0;width:100%;height:100%;display:block`
5. Touch guard pattern — `let tapping=false; ontouchstart` gate
6. First frame never blank — pre-render letters with fallback weather data
7. Realistic fallback data: temp 28.0, wind 5.0, direction 90
8. Short description text (`#desc` div, bottom center, muted opacity, system-ui font, 11px)
9. Full-viewport, mobile-responsive with generous tap targets (>44px)
10. Works offline after first load (no CDN deps for the core app)
11. `.nojekyll` file at project root
12. No em-dashes (use hyphens) in any user-visible strings
13. Use system-ui, sans-serif for all text elements — no Georgia, Inter, Roboto, Open Sans
14. Chrome positions: stamp bottom:20px left:16px, legend bottom:44px center (show if needed), desc bottom:68px center, hero number top-right: 24px
15. All palette colors must be locked as JS const PALETTE and used consistently

## Render tier
toolcraft — Pixel Point Toolcraft starter, Vite build, deploy dist/

## Deploy
- Slug: textdrift
- URL: https://textdrift.parthchandak.info
- GitHub: https://github.com/parthchandak02/textdrift
