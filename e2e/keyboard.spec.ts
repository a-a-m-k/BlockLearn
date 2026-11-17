import { expect, test } from "@playwright/test";

import {
  correctOption,
  openChapter,
  progressStatus,
  quizGroup,
  quizQuestion,
} from "./helpers";

const slug = "what-is-blockchain";

test("arrow keys move through a question and Enter answers it", async ({
  page,
}) => {
  await openChapter(page, slug);

  const group = quizGroup(page, slug, 0);
  const radios = group.getByRole("radio");
  await expect(radios.nth(0)).toHaveAttribute("tabindex", "0");

  const question = quizQuestion(slug, 0);
  const correctIndex = question.options.findIndex(
    (option) => option.id === question.correctOptionId,
  );

  await radios.nth(0).focus();
  for (let step = 0; step < correctIndex; step++) {
    await page.keyboard.press("ArrowDown");
  }
  await expect(radios.nth(correctIndex)).toBeFocused();
  await expect(radios.nth(correctIndex)).toHaveAttribute("tabindex", "0");
  await expect(radios.nth(0)).toHaveAttribute("tabindex", "-1");

  await page.keyboard.press("Enter");

  await expect(correctOption(page, slug, 0)).toBeChecked();
  await expect(group.locator("..").getByRole("status")).toContainText(
    "Correct",
  );
  await expect(progressStatus(page, 1)).toBeVisible();
  for (const radio of await radios.all()) {
    await expect(radio).toBeDisabled();
  }
});

test("a wrong answer by keyboard can be retried without losing focus", async ({
  page,
}) => {
  await openChapter(page, slug);

  const group = quizGroup(page, slug, 0);
  const radios = group.getByRole("radio");
  const question = quizQuestion(slug, 0);
  const wrongIndex = question.options.findIndex(
    (option) => option.id !== question.correctOptionId,
  );

  await radios.nth(0).focus();
  await page.keyboard.press("Home");
  for (let step = 0; step < wrongIndex; step++) {
    await page.keyboard.press("ArrowDown");
  }
  await page.keyboard.press("Enter");

  await expect(group.locator("..").getByRole("status")).toContainText(
    "Incorrect",
  );

  await group.locator("..").getByRole("button", { name: "Try again" }).click();

  await expect(radios.nth(wrongIndex)).toBeFocused();
  await expect(radios.nth(wrongIndex)).not.toBeChecked();
  await expect(progressStatus(page, 0)).toBeVisible();
});
