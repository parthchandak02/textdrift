export const TEXTDRIFT_TARGETS = {
  background: "appearance.background",
  cityPreset: "place.city",
  drift: "type.drift",
  face: "type.face",
  includeBackground: "export.includeBackground",
  latitude: "place.latitude",
  longitude: "place.longitude",
  text: "words.text",
} as const;

export const FACES = [
  { family: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif", label: "Serif", value: "serif", weight: 700 },
  { family: "'Avenir Next', 'Helvetica Neue', Arial, sans-serif", label: "Sans", value: "sans", weight: 800 },
  { family: "'SF Mono', Menlo, Consolas, monospace", label: "Mono", value: "mono", weight: 600 },
] as const;
export type FaceValue = (typeof FACES)[number]["value"];

export const TEXTDRIFT_DEFAULTS = { background: "#EFEAE0", drift: 1, face: "serif" as FaceValue, latitude: -41.29, longitude: 174.78, text: "weather" } as const;

export const CITY_PRESETS = [
  { label: "London", latitude: 51.51, longitude: -0.13, value: "city-london" },
  { label: "Singapore", latitude: 1.29, longitude: 103.85, value: "city-singapore" },
  { label: "Chicago", latitude: 41.88, longitude: -87.63, value: "city-chicago" },
  { label: "Mumbai", latitude: 19.08, longitude: 72.88, value: "city-mumbai" },
  { label: "Reykjavík", latitude: 64.15, longitude: -21.94, value: "city-reykjavik" },
  { label: "Wellington", latitude: -41.29, longitude: 174.78, value: "city-wellington" },
  { label: "Cairo", latitude: 30.04, longitude: 31.24, value: "city-cairo" },
  { label: "Seattle", latitude: 47.61, longitude: -122.33, value: "city-seattle" },
] as const;

export type TextdriftSettings = {
  background: string;
  drift: number;
  face: FaceValue;
  includeBackground: boolean;
  latitude: number;
  longitude: number;
  placeName: string | null;
  text: string;
};

const num = (value: unknown, fallback: number) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

function colorValue(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof (value as { hex?: unknown }).hex === "string") return (value as { hex: string }).hex;
  return fallback;
}

export function readTextdriftSettings(values: Readonly<Record<string, unknown>>): TextdriftSettings {
  const latitude = num(values[TEXTDRIFT_TARGETS.latitude], TEXTDRIFT_DEFAULTS.latitude);
  const longitude = num(values[TEXTDRIFT_TARGETS.longitude], TEXTDRIFT_DEFAULTS.longitude);
  const city = CITY_PRESETS.find((preset) => Math.abs(preset.latitude - latitude) < 0.005 && Math.abs(preset.longitude - longitude) < 0.005);
  const text = values[TEXTDRIFT_TARGETS.text];
  return {
    background: colorValue(values[TEXTDRIFT_TARGETS.background], TEXTDRIFT_DEFAULTS.background),
    drift: Math.max(0, num(values[TEXTDRIFT_TARGETS.drift], TEXTDRIFT_DEFAULTS.drift)),
    face: FACES.find((face) => face.value === values[TEXTDRIFT_TARGETS.face])?.value ?? TEXTDRIFT_DEFAULTS.face,
    includeBackground: values[TEXTDRIFT_TARGETS.includeBackground] !== false,
    latitude,
    longitude,
    placeName: city?.label ?? null,
    text: (typeof text === "string" ? text : TEXTDRIFT_DEFAULTS.text).slice(0, 40),
  };
}
