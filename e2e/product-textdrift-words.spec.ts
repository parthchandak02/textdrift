import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { fieldValue, openTextdrift, outputSelector, waitForFrame } from "./textdrift-test-helpers";
import { test } from "./toolcraft-product-test";
import { TEXTDRIFT_TARGETS } from "../src/textdrift/textdrift-settings";

test(`browser: textdrift control ${TEXTDRIFT_TARGETS.text}`, async ({ page }) => {
  const session = await openTextdrift(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(TEXTDRIFT_TARGETS.text, async () => {
      await fieldValue(page, TEXTDRIFT_TARGETS.text, "gale force");
      await waitForFrame(page);
    }),
    { requirementId: TEXTDRIFT_TARGETS.text, selector: outputSelector },
  );
  await expectToolcraftReferenceParity(async () => (await getToolcraftControlFieldByTarget(page, TEXTDRIFT_TARGETS.text)).getByRole("textbox").inputValue(), "gale force", {
    requirementId: TEXTDRIFT_TARGETS.text,
    target: TEXTDRIFT_TARGETS.text,
  });
});
