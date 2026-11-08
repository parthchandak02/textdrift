import { expect, type Locator, type Page } from "@playwright/test";

import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";

export const outputSelector = '[data-testid="textdrift-output"]';

export async function waitForFrame(page: Page): Promise<void> {
  await expect(page.locator(outputSelector)).toHaveAttribute("data-frame-ready", "true", { timeout: 15_000 });
}

/** Deterministic current weather per place: wind and warmth depend on the coordinates. */
export function stubWeatherJson(latitude: number, longitude: number) {
  return {
    current: {
      apparent_temperature: 24 - Math.abs(latitude) / 3,
      cloud_cover: 50,
      precipitation: Math.abs(longitude) > 100 ? 0.6 : 0,
      relative_humidity_2m: 70,
      temperature_2m: 26 - Math.abs(latitude) / 2.5,
      time: "2026-06-21T12:00",
      wind_direction_10m: (longitude * 2 + 360) % 360,
      wind_gusts_10m: 40,
      wind_speed_10m: 18 + Math.abs(latitude) / 3,
    },
    timezone: "UTC",
  };
}

export async function stubWeather(page: Page): Promise<void> {
  await page.route("https://api.open-meteo.com/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: stubWeatherJson(Number(url.searchParams.get("latitude")), Number(url.searchParams.get("longitude"))) });
  });
}

export async function openTextdrift(page: Page) {
  await stubWeather(page);
  await page.goto("/");
  // A cold dev server may optimize dependencies and reload the page once; wait for a finished frame first
  await page.waitForLoadState("networkidle");
  await expect(page.locator(outputSelector)).toHaveAttribute("data-frame-ready", "true", { timeout: 30_000 });
  await expect(page.locator(outputSelector)).toHaveAttribute("data-weather-source", "live");
  const session = await createToolcraftBrowserProofSession(page);
  await waitForFrame(page);
  return session;
}

export async function reveal(field: Locator): Promise<void> {
  await field.evaluate((element) => element.scrollIntoView({ block: "center" }));
}

export async function fieldValue(page: Page, target: string, value: string): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, target);
  await reveal(field);
  const input = field.getByRole("textbox");
  await input.fill(value);
  await input.press("Enter");
}

export async function selectValue(page: Page, target: string, label: string): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, target);
  await reveal(field);
  await field.getByRole("combobox").click();
  await page.getByRole("option", { exact: true, name: label }).click();
}

export async function setSlider(page: Page, target: string, value: number): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, target);
  await reveal(field);
  await field.getByRole("button", { name: /^Edit .* value$/ }).click();
  const input = field.getByRole("textbox");
  await expect(input).toBeFocused();
  await input.fill(String(value));
  await input.press("Enter");
  await expect(field.getByRole("button", { name: /^Edit .* value$/ })).toContainText(String(value));
}

/** Press a slider thumb and drag it toward `ratio` of the track while the pointer stays down. */
export async function holdSliderDrag(page: Page, target: string, ratio: number): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, target);
  await reveal(field);
  const slider = field.getByRole("slider");
  const thumb = await slider.boundingBox();
  const track = await field.locator('[data-slot="slider"]').first().boundingBox();
  expect(thumb).not.toBeNull();
  expect(track).not.toBeNull();
  await page.mouse.move(thumb!.x + thumb!.width / 2, thumb!.y + thumb!.height / 2);
  await page.mouse.down();
  await page.mouse.move(track!.x + track!.width * ratio, track!.y + track!.height / 2, { steps: 8 });
}

export async function downloadImage(page: Page) {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /^Export (PNG|JPG)$/ }).click();
  return download;
}

export async function fitScene(page: Page): Promise<void> {
  await page.getByRole("switch", { exact: true, name: "Infinity canvas" }).uncheck();
  await fieldValue(page, "canvas.size.width", "960");
  await page.getByRole("button", { exact: true, name: "Center canvas" }).click();
  await waitForFrame(page);
}
