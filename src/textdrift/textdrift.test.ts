import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { assessToolcraftRenderPlan, compileToolcraftPerformanceFixturePlan } from "@/toolcraft/runtime";

import { textdriftPerformancePaths, appPerformance } from "../app/app-performance";
import { appSchema } from "../app/app-schema";
import { handleTextdriftAction } from "./textdrift-actions";
import { compass, downwind, drawTextdrift, RAIN, tempColor, textdriftInk } from "./textdrift-draw";
import { textdriftExport } from "./textdrift-export";
import { textdriftPerformanceModel } from "./textdrift-performance-model";
import { textdriftPipeline } from "./textdrift-pipeline";
import { CITY_PRESETS, FACES, readTextdriftSettings, TEXTDRIFT_TARGETS } from "./textdrift-settings";
import { clearWeatherCache, fallbackWeather, loadWeather, parseWeatherResponse, weatherUrl, type Weather } from "./weather-data";

type Call = unknown[];

function recordingContext(calls: Call[]): CanvasRenderingContext2D {
  let font = "10px sans-serif";
  return new Proxy({}, {
    get: (_target, key) => {
      if (key === "font") return font;
      if (key === "measureText") return (text: string) => ({ width: text.length * parseFloat(/(\d+(\.\d+)?)px/.exec(font)?.[1] ?? "10") * 0.55 });
      return (...args: unknown[]) => calls.push([key, ...args]);
    },
    set: (_target, key, value) => {
      if (key === "font") font = value;
      calls.push([key, value]);
      return true;
    },
  }) as CanvasRenderingContext2D;
}

const weatherFor = (values: Record<string, unknown>): Weather => {
  const s = readTextdriftSettings(values);
  const base = fallbackWeather(s.latitude, s.longitude);
  // Make the sample depend on place so place controls are observable offline
  return { ...base, temperature: 30 - Math.abs(s.latitude) / 2, windDirection: (s.longitude + 360) % 360 };
};

function draw(values: Record<string, unknown> = {}, weather?: Weather, width = 1920, height = 1080): Call[] {
  const calls: Call[] = [];
  drawTextdrift(recordingContext(calls), width, height, readTextdriftSettings(values), weather ?? weatherFor(values));
  return calls;
}
const signature = (calls: Call[]) => createHash("sha256").update(JSON.stringify(calls)).digest("hex");
const texts = (calls: Call[]) => calls.filter((call) => call[0] === "fillText").map((call) => String(call[1]));
const DEFAULT = signature(draw());

describe("weather", () => {
  it("asks for current conditions", () => {
    const url = new URL(weatherUrl(51.51, -0.13));
    expect(url.searchParams.get("current")?.split(",")).toEqual(expect.arrayContaining(["temperature_2m", "wind_speed_10m", "wind_direction_10m", "precipitation"]));
  });

  it("parses the response and falls back when offline", async () => {
    const parsed = parseWeatherResponse({ current: { precipitation: 0.4, temperature_2m: 12.5, time: "2026-11-08T14:00", wind_direction_10m: 270, wind_speed_10m: 30 }, timezone: "Europe/London" }, 51.51, -0.13);
    expect(parsed?.temperature).toBe(12.5);
    expect(parseWeatherResponse({}, 0, 0)).toBeNull();
    clearWeatherCache();
    const offline = await loadWeather(1, 2, (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch);
    expect(offline.source).toBe("fallback");
    expect(texts(draw()).join("")).toContain("offline sample");
  });

  it("maps temperature, wind and rain", () => {
    expect(tempColor(-20)).toBe("#4062D8");
    expect(tempColor(20)).toBe("#E0A630");
    expect(compass(225)).toBe("SW");
    expect(downwind(270).x).toBeCloseTo(1, 6);
    const dry = draw({}, { ...fallbackWeather(0, 0), precipitation: 0 });
    const wet = draw({}, { ...fallbackWeather(0, 0), precipitation: 2 });
    expect(dry.some((call) => call[0] === "strokeStyle" && String(call[1]).startsWith("rgba(78, 120, 168"))).toBe(false);
    expect(wet.some((call) => call[0] === "strokeStyle" && String(call[1]).startsWith(`rgba(78, 120, 168`))).toBe(true);
    expect(RAIN).toBe("#4E78A8");
  });

  it("pushes letters further in a stronger wind", () => {
    const xs = (speed: number) => draw({}, { ...fallbackWeather(0, 0), windDirection: 270, windSpeed: speed }).filter((call) => call[0] === "translate").map((call) => call[1] as number);
    expect(Math.max(...xs(50))).toBeGreaterThan(Math.max(...xs(2)));
  });
});

describe("Textdrift controls", () => {
  it("textdrift control words.text", () => {
    expect(signature(draw({ [TEXTDRIFT_TARGETS.text]: "storm" }))).not.toBe(DEFAULT);
    expect(texts(draw({ [TEXTDRIFT_TARGETS.text]: "storm" }))).toContain("m");
  });

  it("textdrift control place.city", () => {
    for (const city of CITY_PRESETS) {
      const dispatch = vi.fn();
      handleTextdriftAction({ action: { value: city.value }, dispatch });
      expect(dispatch.mock.calls.map(([command]) => command)).toEqual([
        expect.objectContaining({ target: TEXTDRIFT_TARGETS.latitude, value: city.latitude }),
        expect.objectContaining({ target: TEXTDRIFT_TARGETS.longitude, value: city.longitude }),
      ]);
      expect(texts(draw({ [TEXTDRIFT_TARGETS.latitude]: city.latitude, [TEXTDRIFT_TARGETS.longitude]: city.longitude })).join("")).toContain(city.label.toUpperCase().slice(0, 1));
    }
  });

  it("textdrift control place.latitude", () => {
    expect(signature(draw({ [TEXTDRIFT_TARGETS.latitude]: 10 }))).not.toBe(DEFAULT);
  });

  it("textdrift control place.longitude", () => {
    expect(signature(draw({ [TEXTDRIFT_TARGETS.longitude]: 100 }))).not.toBe(DEFAULT);
  });

  it("textdrift control type.face", () => {
    expect(new Set(FACES.map((face) => signature(draw({ [TEXTDRIFT_TARGETS.face]: face.value })))).size).toBe(FACES.length);
  });

  it("textdrift control type.drift", () => {
    expect(signature(draw({ [TEXTDRIFT_TARGETS.drift]: 2 }))).not.toBe(DEFAULT);
  });
});

describe("Textdrift contracts", () => {
  it("textdrift contract appearance.background", () => {
    expect(textdriftInk({ background: "#EFEAE0", includeBackground: true })).toBe("#1D1A17");
    expect(textdriftInk({ background: "#14181F", includeBackground: true })).toBe("#F1ECE3");
    expect(signature(draw({ [TEXTDRIFT_TARGETS.background]: "#14181F" }))).not.toBe(DEFAULT);
  });

  it("textdrift contract background.output", () => {
    const fullFills = (calls: Call[]) => calls.filter((call) => call[0] === "fillRect" && call[3] === 1920 && call[4] === 1080);
    expect(fullFills(draw())).toHaveLength(0);
    expect(fullFills(draw({ [TEXTDRIFT_TARGETS.includeBackground]: false }))).toHaveLength(0);
  });

  it("textdrift contract export.image.format", () => {
    const control = appSchema.panels.controls?.sections.flatMap((section) => Object.values(section.controls)).find((entry) => entry.target === "export.image.format");
    expect(control?.options?.map((option) => option.value)).toEqual(["png", "jpg"]);
  });

  it("textdrift contract export.image.resolution", () => {
    const control = appSchema.panels.controls?.sections.flatMap((section) => Object.values(section.controls)).find((entry) => entry.target === "export.image.resolution");
    expect(control?.options?.map((option) => option.value)).toEqual(["2k", "4k", "8k"]);
  });

  it("textdrift contract export.image", async () => {
    clearWeatherCache();
    vi.stubGlobal("fetch", async () => {
      throw new Error("offline");
    });
    const calls: Call[] = [];
    await textdriftExport.renderFrame({ context: recordingContext(calls), frame: { height: 1080, width: 1920, x: -960, y: -540 }, signal: new AbortController().signal, state: { values: {} } } as unknown as Parameters<typeof textdriftExport.renderFrame>[0]);
    vi.unstubAllGlobals();
    expect(calls[1]).toEqual(["translate", -960, -540]);
    expect(texts(calls).join("")).toContain("WELLINGTON");
  });

  it("textdrift contract export.infinity", () => {
    expect(textdriftPipeline.passes.find((pass) => pass.id === "raster")?.sceneBounds?.kind).toBe("intrinsic");
  });

  it("textdrift contract canvas.size", () => {
    expect(signature(draw({}, undefined, 960, 540))).not.toBe(DEFAULT);
  });

  it("textdrift contract canvas.scale", () => {
    const raster = textdriftPipeline.passes.find((pass) => pass.id === "raster");
    expect(raster?.invalidatedBy).toContain("canvas.renderScale");
    expect(appSchema.canvas.renderScale.enabled).toBe(true);
  });

  it("textdrift contract canvas.infinity", () => {
    expect(textdriftPipeline.interactionInvalidation.find((entry) => entry.targets.includes("canvas.infinity"))?.invalidates).toEqual([]);
  });

  it("textdrift render plan has valid derived paths and fixtures", () => {
    expect(assessToolcraftRenderPlan(appSchema, textdriftPerformanceModel).errors ?? []).toEqual([]);
    expect(textdriftPerformancePaths.length).toBe(appPerformance.scenarios.length);
    for (const path of textdriftPerformancePaths) {
      if (path.workloadDimensions.length) expect(() => compileToolcraftPerformanceFixturePlan(textdriftPerformanceModel, path)).not.toThrow();
    }
  });
});
