import { expect, test } from "@playwright/test";

import { chapters } from "../lib/course";
import { openChapter } from "./helpers";

test("the syllabus and Continue links walk the whole course", async ({
  page,
}) => {
  const first = chapters[0];
  if (!first) throw new Error("course catalog is empty");

  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Course chapters" })
    .getByRole("link", { name: first.title })
    .click();

  for (const [index, chapter] of chapters.entries()) {
    await expect(page).toHaveURL(new RegExp(`/chapters/${chapter.slug}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      chapter.title,
    );

    const chapterNav = page.getByRole("navigation", {
      name: "Chapter navigation",
    });
    if (index === 0) {
      await expect(
        chapterNav.getByRole("link", { name: "Back to course" }),
      ).toHaveAttribute("href", "/");
    }

    const next = chapters[index + 1];
    const continueLink = chapterNav.getByRole("link", { name: /Continue:/ });
    if (!next) {
      await expect(continueLink).toHaveCount(0);
      break;
    }
    await expect(continueLink).toHaveText(`Continue: ${next.title}`);
    await continueLink.click();
  }
});

test("an unknown chapter shows the 404 page with a way back in", async ({
  page,
}) => {
  const response = await page.goto("/chapters/nope");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Start chapter 1" }).click();
  await expect(page).toHaveURL(/\/chapters\/what-is-blockchain$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "What is Blockchain?",
  );
});

test("on a phone, the sidebar opens, navigates, and closes", {
  tag: "@phone",
}, async ({ page }) => {
  await openChapter(page, "what-is-blockchain");

  const sidebar = page.getByRole("dialog", { name: "Sidebar" });
  await expect(sidebar).toHaveCount(0);

  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await expect(sidebar).toBeVisible();
  await expect(
    sidebar.getByRole("link", { name: /What is Blockchain\?/ }),
  ).toHaveAttribute("aria-current", "page");

  await sidebar.getByRole("link", { name: /Consensus Mechanisms/ }).click();
  await expect(page).toHaveURL(/\/chapters\/consensus$/);
  await expect(sidebar).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Consensus Mechanisms",
  );

  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await expect(
    sidebar.getByRole("link", { name: /Consensus Mechanisms/ }),
  ).toHaveAttribute("aria-current", "page");
});
