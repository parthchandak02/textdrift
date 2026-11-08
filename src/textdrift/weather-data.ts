// Current weather for Textdrift: Open-Meteo forecast API, cached per place, with a labelled fallback.

export const FORECAST_API = "https://api.open-meteo.com/v1/forecast";

export type Weather = {
  cloudCover: number;
  feelsLike: number;
  gusts: number;
  humidity: number;
  key: string;
  precipitation: number;
  source: "fallback" | "live";
  temperature: number;
  time: string;
  timezone: string;
  windDirection: number;
  windSpeed: number;
};

export function weatherKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}

export function weatherUrl(latitude: number, longitude: number): string {
  return (
    `${FORECAST_API}?latitude=${latitude.toFixed(2)}&longitude=${longitude.toFixed(2)}` +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto"
  );
}

export function parseWeatherResponse(json: unknown, latitude: number, longitude: number): Weather | null {
  if (!json || typeof json !== "object") return null;
  const data = json as { current?: Record<string, unknown>; timezone?: unknown };
  if (!data.current || typeof data.current.temperature_2m !== "number") return null;
  const n = (key: string) => (typeof data.current?.[key] === "number" ? (data.current[key] as number) : 0);
  return {
    cloudCover: n("cloud_cover"),
    feelsLike: n("apparent_temperature"),
    gusts: n("wind_gusts_10m"),
    humidity: n("relative_humidity_2m"),
    key: weatherKey(latitude, longitude),
    precipitation: n("precipitation"),
    source: "live",
    temperature: n("temperature_2m"),
    time: String(data.current.time ?? ""),
    timezone: typeof data.timezone === "string" ? data.timezone : "UTC",
    windDirection: n("wind_direction_10m"),
    windSpeed: n("wind_speed_10m"),
  };
}

/** A mild breezy day used offline (clearly labelled on the poster). */
export function fallbackWeather(latitude: number, longitude: number): Weather {
  return { cloudCover: 40, feelsLike: 17, gusts: 30, humidity: 60, key: weatherKey(latitude, longitude), precipitation: 0, source: "fallback", temperature: 18, time: "2026-06-21T12:00", timezone: "UTC", windDirection: 250, windSpeed: 20 };
}

const cache = new Map<string, Weather>();
const pending = new Map<string, Promise<Weather>>();

export function getCachedWeather(latitude: number, longitude: number): Weather | null {
  return cache.get(weatherKey(latitude, longitude)) ?? null;
}

export function loadWeather(latitude: number, longitude: number, fetcher: typeof fetch = (...args) => fetch(...args)): Promise<Weather> {
  const key = weatherKey(latitude, longitude);
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;
  const request = fetcher(weatherUrl(latitude, longitude))
    .then((response) => response.json())
    .then((json) => parseWeatherResponse(json, latitude, longitude) ?? fallbackWeather(latitude, longitude))
    .catch(() => fallbackWeather(latitude, longitude))
    .then((data) => {
      if (cache.size > 24) cache.delete(cache.keys().next().value!);
      cache.set(key, data);
      pending.delete(key);
      return data;
    });
  pending.set(key, request);
  return request;
}

export function clearWeatherCache(): void {
  cache.clear();
  pending.clear();
}
