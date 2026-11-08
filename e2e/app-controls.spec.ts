import { openTextdrift } from "./textdrift-test-helpers";
import { expect, test } from "./toolcraft-product-test";

test("browser: textdrift opens in the Toolcraft shell", async ({ page }) => {
  await openTextdrift(page);
  await expect(page.getByRole("button", { exact: true, name: "Export PNG" })).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "Singapore" })).toBeVisible();
  await expect(page.getByRole("application", { name: "Canvas viewport" })).toBeVisible();
});
