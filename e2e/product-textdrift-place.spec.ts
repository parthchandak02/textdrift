import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { holdSliderDrag, openTextdrift, outputSelector, reveal, waitForFrame } from "./textdrift-test-helpers";
import { expect, test } from "./toolcraft-product-test";
import { TEXTDRIFT_TARGETS, CITY_PRESETS } from "../src/textdrift/textdrift-settings";

for (const [target, ratio] of [[TEXTDRIFT_TARGETS.latitude, 0.3], [TEXTDRIFT_TARGETS.longitude, 0.8]] as const) {
  test(`browser: textdrift control ${target}`, async ({ page }) => {
    const session = await openTextdrift(page);
    const field = await getToolcraftControlFieldByTarget(page, target);
    const before = await field.getByRole("slider").getAttribute("aria-valuenow");
    await expectToolcraftProductObservableToChange(session, session.controlAction(target, () => holdSliderDrag(page, target, ratio)), { requirementId: target, selector: outputSelector });
    await page.mouse.up();
    await waitForFrame(page);
    await expectToolcraftReferenceParity(async () => (await field.getByRole("slider").getAttribute("aria-valuenow")) !== before, true, { requirementId: target, target });
  });
}

test(`browser: textdrift control ${TEXTDRIFT_TARGETS.cityPreset}`, async ({ page }) => {
  const session = await openTextdrift(page);
  const order = [...CITY_PRESETS.slice(1), CITY_PRESETS[0]];
  for (const city of order) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(TEXTDRIFT_TARGETS.cityPreset, async (field) => {
        await reveal(field);
        await field.getByRole("button", { exact: true, name: city.label }).click();
        await waitForFrame(page);
      }),
      { requirementId: TEXTDRIFT_TARGETS.cityPreset, selector: outputSelector },
    );
    await expect((await getToolcraftControlFieldByTarget(page, TEXTDRIFT_TARGETS.latitude)).getByRole("slider")).toHaveAttribute("aria-valuenow", String(city.latitude));
  }
  await expectToolcraftReferenceParity(
    async () => (await getToolcraftControlFieldByTarget(page, TEXTDRIFT_TARGETS.longitude)).getByRole("slider").getAttribute("aria-valuenow"),
    String(CITY_PRESETS[0].longitude),
    { requirementId: TEXTDRIFT_TARGETS.cityPreset, target: TEXTDRIFT_TARGETS.cityPreset },
  );
});
