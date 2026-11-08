import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftInfinityCanvasImageExportEvidence } from "./browser-infinity-canvas-evidence";
import { expectToolcraftImageExportArtifact } from "./browser-media-export-evidence";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import { downloadImage, openTextdrift, selectValue } from "./textdrift-test-helpers";
import { test } from "./toolcraft-product-test";
import { tempColor, textdriftLayout } from "../src/textdrift/textdrift-draw";
import { TEXTDRIFT_DEFAULTS } from "../src/textdrift/textdrift-settings";
import { stubWeatherJson } from "./textdrift-test-helpers";

const hex = (color: string) => [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16), 255] as const;
const backgroundRgba = hex(TEXTDRIFT_DEFAULTS.background);
const { chip } = textdriftLayout(1920, 1080);
const temperature = stubWeatherJson(TEXTDRIFT_DEFAULTS.latitude, TEXTDRIFT_DEFAULTS.longitude).current.temperature_2m;
const swatch = { rgba: hex(tempColor(temperature)), xRatio: (chip.x + chip.size / 2) / 1920, yRatio: (chip.y + chip.size / 2) / 1080 };

const posterArtifact = {
  backgroundRgba,
  // Measured from a real export of the default poster with stubbed weather
  expectedBounds: { height: 0.796875, width: 0.90625, x: 0.046875, y: 0.09375 },
  expectedPixels: [
    swatch,
    { rgba: backgroundRgba, xRatio: 0.02, yRatio: 0.02 },
  ],
};

test("browser: textdrift image export delivers every format and size", async ({ page }) => {
  const session = await openTextdrift(page);
  const artifact = posterArtifact;
  for (const [format, mediaType] of [["PNG", "image/png"], ["JPG", "image/jpeg"]] as const) {
    await selectValue(page, "export.image.format", format);
    for (const [resolution, width] of [["2K", 2048], ["4K", 4096], ["8K", 8192]] as const) {
      await selectValue(page, "export.image.resolution", resolution);
      await expectToolcraftImageExportArtifact(session.targetAction("actions.output", () => downloadImage(page)), {
        ...artifact,
        additionalArtifactRequirements: [
          { requirementId: "export.image.format", target: "export.image.format" },
          { requirementId: "export.image.resolution", target: "export.image.resolution" },
        ],
        expectedHeight: (width * 9) / 16,
        expectedMediaType: mediaType,
        expectedWidth: width,
        page,
        requirementId: "export.image",
      });
    }
  }
  await selectValue(page, "export.image.format", "PNG");
  await selectValue(page, "export.image.resolution", "2K");
  await page.getByRole("switch", { exact: true, name: "Infinity canvas" }).uncheck();
  const finite = (await inspectToolcraftImageDownload({ backgroundRgba, download: await downloadImage(page), page })).inspection;
  await page.getByRole("switch", { exact: true, name: "Infinity canvas" }).check();
  const infinite = (await inspectToolcraftImageDownload({ backgroundRgba, download: await downloadImage(page), page })).inspection;
  await expectToolcraftInfinityCanvasImageExportEvidence({ finite, infinite }, { expectedSize: { height: 1152, width: 2048 }, requirementId: "export.infinity", target: "actions.output" });
  await expectToolcraftReferenceParity(async () => [infinite.width / infinite.height, infinite.decodedPixelHash === finite.decodedPixelHash], [16 / 9, true], { requirementId: "export.infinity", target: "actions.output" });
});
