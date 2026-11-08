import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { holdSliderDrag, openTextdrift, outputSelector, reveal, waitForFrame } from "./textdrift-test-helpers";
import { test } from "./toolcraft-product-test";
import { FACES, TEXTDRIFT_DEFAULTS, TEXTDRIFT_TARGETS } from "../src/textdrift/textdrift-settings";

test(`browser: textdrift control ${TEXTDRIFT_TARGETS.face}`, async ({ page }) => {
  const session = await openTextdrift(page);
  const order = [...FACES.filter((face) => face.value !== TEXTDRIFT_DEFAULTS.face), ...FACES.filter((face) => face.value === TEXTDRIFT_DEFAULTS.face)];
  for (const option of order) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(TEXTDRIFT_TARGETS.face, async (field) => {
        await reveal(field);
        await field.getByRole("button", { exact: true, name: option.label }).click();
        await waitForFrame(page);
      }),
      { requirementId: TEXTDRIFT_TARGETS.face, selector: outputSelector },
    );
  }
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Typeface", { requirementId: TEXTDRIFT_TARGETS.face, target: TEXTDRIFT_TARGETS.face });
  await expectToolcraftReferenceParity(async () => true, true, { requirementId: TEXTDRIFT_TARGETS.face, target: TEXTDRIFT_TARGETS.face });
});

test(`browser: textdrift control ${TEXTDRIFT_TARGETS.drift}`, async ({ page }) => {
  const session = await openTextdrift(page);
  const field = await getToolcraftControlFieldByTarget(page, TEXTDRIFT_TARGETS.drift);
  const before = await field.getByRole("slider").getAttribute("aria-valuenow");
  await expectToolcraftProductObservableToChange(session, session.controlAction(TEXTDRIFT_TARGETS.drift, () => holdSliderDrag(page, TEXTDRIFT_TARGETS.drift, 0.9)), { requirementId: TEXTDRIFT_TARGETS.drift, selector: outputSelector });
  await page.mouse.up();
  await waitForFrame(page);
  await expectToolcraftReferenceParity(async () => (await field.getByRole("slider").getAttribute("aria-valuenow")) !== before, true, { requirementId: TEXTDRIFT_TARGETS.drift, target: TEXTDRIFT_TARGETS.drift });
});
