// Draws one Textdrift frame in scene coordinates. The runtime paints the Background; this is foreground.

import { FACES, type TextdriftSettings } from "./textdrift-settings";
import type { Weather } from "./weather-data";

const SANS = "'Avenir Next', 'Helvetica Neue', Arial, sans-serif";
const TRAIL = 6;
export const RAIN = "#4E78A8";

function rgb(hex: string): [number, number, number] {
  const v = /^#?([0-9a-f]{6})$/i.exec(hex.trim())?.[1] ?? "000000";
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

const toHex = (c: readonly number[]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase()}`;

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function textdriftInk(settings: Pick<TextdriftSettings, "background" | "includeBackground">): string {
  const [r, g, b] = rgb(settings.background);
  return settings.includeBackground && (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45 ? "#F1ECE3" : "#1D1A17";
}

const TEMP_STOPS: readonly [number, string][] = [[-10, "#4062D8"], [0, "#3E9AD6"], [10, "#36A98F"], [20, "#E0A630"], [30, "#E0623A"], [40, "#B0283C"]];

/** Colour of an air temperature in °C. */
export function tempColor(celsius: number): string {
  if (celsius <= TEMP_STOPS[0][0]) return TEMP_STOPS[0][1];
  for (let i = 1; i < TEMP_STOPS.length; i += 1) {
    const [t1, c1] = TEMP_STOPS[i];
    if (celsius <= t1) {
      const [t0, c0] = TEMP_STOPS[i - 1];
      const f = (celsius - t0) / (t1 - t0);
      const a = rgb(c0);
      const b = rgb(c1);
      return toHex(a.map((v, k) => v + (b[k] - v) * f));
    }
  }
  return TEMP_STOPS[TEMP_STOPS.length - 1][1];
}

const SHORT = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
export const compass = (degrees: number) => SHORT[Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16];

/** Unit vector the wind blows toward, in screen space (x east, y south). */
export function downwind(fromDegrees: number): { x: number; y: number } {
  const from = (fromDegrees * Math.PI) / 180;
  return { x: -Math.sin(from), y: Math.cos(from) };
}

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Glyph = { angle: number; char: string; color: string; x: number; y: number };

/** Where each letter lands: laid out on one line, then pushed downwind by the weather. */
export function placeGlyphs(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, text: string, weather: Weather, drift: number, u: number, centre: { x: number; y: number }, maxWidth: number): { glyphs: Glyph[]; size: number; strength: number } {
  const chars = [...text];
  let size = 320;
  context.font = `${size * u}px serif`;
  const measure = () => chars.reduce((sum, char) => sum + context.measureText(char).width, 0);
  const base = context.font;
  while (measure() > maxWidth && size > 60) {
    size -= 10;
    context.font = base.replace(/[\d.]+px/, `${size * u}px`);
  }
  const strength = Math.min(1.4, weather.windSpeed / 45) * drift;
  const gustiness = Math.min(1, Math.max(0, weather.gusts - weather.windSpeed) / 30) * drift;
  const wind = downwind(weather.windDirection);
  const random = seeded(chars.reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7));
  const widths = chars.map((char) => context.measureText(char).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let cursor = centre.x - total / 2;
  const glyphs = chars.map((char, i) => {
    const t = chars.length > 1 ? i / (chars.length - 1) : 0.5;
    const push = (0.35 + 0.65 * t + (random() - 0.5) * 0.5) * strength * 150 * u;
    const lift = (random() - 0.5) * gustiness * 90 * u;
    const blend = t;
    const color = toHex(rgb(tempColor(weather.temperature)).map((v, k) => v + (rgb(tempColor(weather.feelsLike))[k] - v) * blend));
    const glyph = {
      angle: (random() - 0.5) * strength * 0.5 + wind.x * strength * 0.12,
      char,
      color,
      x: cursor + widths[i] / 2 + wind.x * push - wind.y * lift,
      y: centre.y + wind.y * push + wind.x * lift,
    };
    cursor += widths[i];
    return glyph;
  });
  return { glyphs, size, strength };
}

/** Scene-unit layout shared with tests. */
export function textdriftLayout(width: number, height: number) {
  const u = Math.min(width / 1920, height / 1080);
  const offsetX = (width - 1920 * u) / 2;
  const offsetY = (height - 1080 * u) / 2;
  const left = offsetX + 96 * u;
  const chip = { size: 72 * u, x: left, y: offsetY + 852 * u };
  return { centre: { x: offsetX + 960 * u, y: offsetY + 500 * u }, chip, left, offsetX, offsetY, u };
}

type Frame = { ink: string; layout: ReturnType<typeof textdriftLayout>; muted: string; settings: TextdriftSettings; weather: Weather };

function tracked(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, text: string, x: number, y: number, spacing: number): void {
  let cursor = x;
  for (const char of text) {
    context.fillText(char, cursor, y);
    cursor += context.measureText(char).width + spacing;
  }
}

function drawRain(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: Frame): void {
  const { weather } = frame;
  const { offsetX, offsetY, u } = frame.layout;
  if (weather.precipitation <= 0) return;
  const count = Math.min(420, Math.round(weather.precipitation * 140) + 30);
  const wind = downwind(weather.windDirection);
  const lean = Math.min(0.8, weather.windSpeed / 60) * wind.x;
  const random = seeded(4242);
  context.strokeStyle = withAlpha(RAIN, 0.4);
  context.lineWidth = 1.6 * u;
  context.lineCap = "round";
  context.beginPath();
  for (let i = 0; i < count; i += 1) {
    const x = offsetX + (60 + random() * 1800) * u;
    const y = offsetY + (150 + random() * 620) * u;
    const length = (18 + random() * 22) * u;
    context.moveTo(x, y);
    context.lineTo(x + lean * length, y + length);
  }
  context.stroke();
}

function drawWords(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: Frame): void {
  const { settings, weather } = frame;
  const { centre, u } = frame.layout;
  const face = FACES.find((entry) => entry.value === settings.face)!;
  context.font = `${face.weight} 100px ${face.family}`;
  const placed = placeGlyphs(context, settings.text || " ", weather, settings.drift, u, centre, 1560 * u);
  const { size, strength } = placed;
  // Keep every letter on the poster, clear of the header and the figures
  const glyphs = placed.glyphs.map((glyph) => ({ ...glyph, x: Math.max(centre.x - 860 * u, Math.min(centre.x + 860 * u, glyph.x)), y: Math.max(centre.y - 300 * u, Math.min(centre.y + 260 * u, glyph.y)) }));
  context.font = `${face.weight} ${size * u}px ${face.family}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const wind = downwind(weather.windDirection);
  // Faint trail upwind of each letter, then the letter itself
  for (let step = TRAIL; step >= 0; step -= 1) {
    for (const glyph of glyphs) {
      const back = step * strength * 26 * u;
      context.save();
      context.translate(glyph.x - wind.x * back, glyph.y - wind.y * back);
      context.rotate(glyph.angle * (1 - step / (TRAIL + 1)));
      context.fillStyle = withAlpha(glyph.color, step === 0 ? 1 : 0.05 + 0.18 * (1 - step / TRAIL));
      context.fillText(glyph.char, 0, 0);
      context.restore();
    }
  }
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
}

function drawHeader(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: Frame): void {
  const { muted, settings, weather } = frame;
  const { left, offsetY, u } = frame.layout;
  const where = settings.placeName ?? `${Math.abs(settings.latitude).toFixed(2)}°${settings.latitude >= 0 ? "N" : "S"} ${Math.abs(settings.longitude).toFixed(2)}°${settings.longitude >= 0 ? "E" : "W"}`;
  context.fillStyle = muted;
  context.font = `600 ${17 * u}px ${SANS}`;
  tracked(context, `TEXTDRIFT · ${where.toUpperCase()} · LOCAL ${weather.time.slice(11, 16) || "--:--"}`, left, offsetY + 118 * u, 3.4 * u);
}

function drawFigures(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: Frame): void {
  const { ink, muted, weather } = frame;
  const { chip, offsetY, u } = frame.layout;
  context.fillStyle = tempColor(weather.temperature);
  context.fillRect(chip.x, chip.y, chip.size, chip.size);
  const figures: [string, string][] = [
    [`${weather.temperature.toFixed(1)} °C`, `feels like ${weather.feelsLike.toFixed(0)} °C`],
    [`${weather.windSpeed.toFixed(0)} km/h`, `wind from ${compass(weather.windDirection)}, gusts ${weather.gusts.toFixed(0)}`],
    [`${weather.precipitation.toFixed(1)} mm`, "rain in the last 15 minutes"],
    [`${weather.humidity.toFixed(0)} %`, "humidity"],
    [`${weather.cloudCover.toFixed(0)} %`, "cloud cover"],
  ];
  figures.forEach(([value, caption], i) => {
    const x = chip.x + chip.size + 24 * u + i * 330 * u;
    context.fillStyle = ink;
    context.font = `300 ${44 * u}px ${SANS}`;
    context.fillText(value, x, chip.y + 40 * u);
    context.fillStyle = muted;
    context.font = `${17 * u}px ${SANS}`;
    context.fillText(caption, x, chip.y + 68 * u);
  });
  context.fillStyle = withAlpha(ink, 0.42);
  context.font = `${14 * u}px ${SANS}`;
  context.fillText(
    `Letters are pushed downwind by the wind speed, coloured from the air temperature to the feels-like temperature, and crossed by rain when it falls. Open-Meteo · ${weather.source === "live" ? "live" : "offline sample"}`,
    chip.x,
    offsetY + 994 * u,
  );
}

export function drawTextdrift(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, width: number, height: number, settings: TextdriftSettings, weather: Weather): void {
  const ink = textdriftInk(settings);
  const frame: Frame = { ink, layout: textdriftLayout(width, height), muted: withAlpha(ink, 0.6), settings, weather };
  context.save();
  context.beginPath();
  context.rect(0, 0, width, height);
  context.clip();
  context.textBaseline = "alphabetic";
  context.textAlign = "left";
  drawRain(context, frame);
  drawWords(context, frame);
  drawHeader(context, frame);
  drawFigures(context, frame);
  context.restore();
}
