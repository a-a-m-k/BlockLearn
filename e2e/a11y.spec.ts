import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { chapters } from "../lib/course";

const routes = ["/", ...chapters.map((c) => `/chapters/${c.slug}`)];

for (const route of routes) {
  test(`${route} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const violations = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
}
