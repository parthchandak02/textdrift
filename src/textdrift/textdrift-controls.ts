import type { ToolcraftControlSchema } from "@/toolcraft/runtime";

import { CITY_PRESETS, FACES, TEXTDRIFT_DEFAULTS, TEXTDRIFT_TARGETS } from "./textdrift-settings";

const live = {
  applicability: { mode: "always" },
  keyframeable: false,
  performanceReason: "Redraws one still poster in a worker; weather loads once per place and is cached.",
  performanceRole: "responsiveness",
} as const;

export const wordsControls = {
  text: { ...live, defaultValue: TEXTDRIFT_DEFAULTS.text, description: "Up to 40 characters, set large and blown by the weather.", label: "Text", target: TEXTDRIFT_TARGETS.text, textValueKind: "single-line", type: "text" },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const placeControls = {
  city: {
    actions: CITY_PRESETS.map((city) => ({ label: city.label, value: city.value, variant: "outline" as const })),
    applicability: { mode: "always" },
    description: "Uses the current weather in the city.",
    label: "Cities",
    performanceReason: "Sets two sliders at once; one weather load and redraw.",
    performanceRole: "responsiveness",
    target: TEXTDRIFT_TARGETS.cityPreset,
    type: "actions",
  },
  latitude: { ...live, defaultValue: TEXTDRIFT_DEFAULTS.latitude, description: "North is positive. Weather reloads for the new place.", label: "Latitude", max: 85, min: -85, sliderValueKind: "continuous", step: 0.01, target: TEXTDRIFT_TARGETS.latitude, type: "slider", unit: "°" },
  longitude: { ...live, defaultValue: TEXTDRIFT_DEFAULTS.longitude, description: "East is positive. Weather reloads for the new place.", label: "Longitude", max: 180, min: -180, sliderValueKind: "continuous", step: 0.01, target: TEXTDRIFT_TARGETS.longitude, type: "slider", unit: "°" },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const typeControls = {
  face: {
    ...live,
    defaultValue: TEXTDRIFT_DEFAULTS.face,
    description: "Typeface for the words.",
    label: "Typeface",
    options: FACES.map((face) => ({ label: face.label, value: face.value })),
    target: TEXTDRIFT_TARGETS.face,
    type: "segmented",
  },
  drift: { ...live, defaultValue: TEXTDRIFT_DEFAULTS.drift, description: "How strongly the wind moves the letters; 1 is true to the wind speed.", label: "Drift", max: 2, min: 0, sliderValueKind: "continuous", step: 0.05, target: TEXTDRIFT_TARGETS.drift, type: "slider", unit: "×" },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const backgroundControls = {
  include: { ...live, defaultValue: true, label: "Background", target: TEXTDRIFT_TARGETS.includeBackground, type: "switch" },
  color: { ...live, defaultValue: TEXTDRIFT_DEFAULTS.background, label: "Background color", target: TEXTDRIFT_TARGETS.background, type: "color" },
} as const satisfies Record<string, ToolcraftControlSchema>;
