import { expect, test } from "@playwright/test";

import { chapters } from "../lib/course";
import { getTotalQuizQuestions } from "../lib/quiz-meta";
import {
  PROGRESS_STORAGE_KEY,
  answerCorrectly,
  correctOption,
  openChapter,
  progressStatus,
  questionKeys,
  quizGroup,
  seedProgress,
  wrongOption,
} from "./helpers";

test("a correct answer counts in the sidebar and carries to the next chapter", async ({
  page,
}) => {
  await openChapter(page, "what-is-blockchain");
  await expect(progressStatus(page, 0)).toBeVisible();

  await answerCorrectly(page, "what-is-blockchain", 0);
  await expect(progressStatus(page, 1)).toBeVisible();

  await page
    .getByRole("navigation", { name: "Chapter navigation" })
    .getByRole("link", { name: /Continue:/ })
    .click();
  await expect(page).toHaveURL(/\/chapters\/blocks-and-hashes$/);
  await expect(progressStatus(page, 1)).toBeVisible();
});

test("finishing a chapter checks it off and moves the syllabus on", async ({
  page,
}) => {
  await openChapter(page, "what-is-blockchain");
  for (const index of [0, 1, 2]) {
    await answerCorrectly(page, "what-is-blockchain", index);
  }
  await expect(progressStatus(page, 3)).toBeVisible();

  await page.goto("/");
  const syllabus = page.getByRole("navigation", { name: "Course chapters" });
  await expect(
    syllabus.getByRole("link", { name: /Completed\. What is Blockchain\?/ }),
  ).toBeVisible();
  await expect(
    syllabus.getByRole("link", { name: /Blocks & Hashes/ }),
  ).toHaveAttribute("aria-current", "step");
  await expect(
    syllabus.getByRole("link", { name: /What is Blockchain\?/ }),
  ).not.toHaveAttribute("aria-current", "step");
});

test("a wrong answer can be retried and a correct one survives reload", async ({
  page,
}) => {
  await openChapter(page, "what-is-blockchain");

  const correct = correctOption(page, "what-is-blockchain", 0);
  await correct.click();
  await expect(progressStatus(page, 1)).toBeVisible();

  const second = quizGroup(page, "what-is-blockchain", 1);
  const wrong = wrongOption(page, "what-is-blockchain", 1);
  await wrong.click();

  await expect(second.locator("..").getByRole("status")).toContainText(
    "Incorrect",
  );
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(wrong).toBeChecked();
  await expect(correctOption(page, "what-is-blockchain", 1)).toHaveAccessibleName(
    /Correct answer/,
  );

  await page.reload();

  await expect(progressStatus(page, 1)).toBeVisible();
  await expect(correct).toBeChecked();
  await expect(
    page.getByRole("status").filter({ hasText: "Incorrect" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);
});

test("reset asks first, then clears progress for good", async ({ page }) => {
  await openChapter(page, "what-is-blockchain");
  const resetTrigger = page.getByRole("button", { name: "Reset progress" });
  await expect(progressStatus(page, 0)).toBeVisible();
  await expect(resetTrigger).toHaveCount(0);

  await seedProgress(page, questionKeys("what-is-blockchain"));
  await page.reload();
  await expect(progressStatus(page, 3)).toBeVisible();

  await resetTrigger.click();
  const dialog = page.getByRole("alertdialog", { name: "Reset progress?" });
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(progressStatus(page, 3)).toBeVisible();

  await resetTrigger.click();
  await dialog.getByRole("button", { name: "Reset progress" }).click();
  await expect(progressStatus(page, 0)).toBeVisible();
  await expect(resetTrigger).toHaveCount(0);

  await page.reload();
  await expect(progressStatus(page, 0)).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), PROGRESS_STORAGE_KEY),
  ).toBe("[]");
});

test("the course-complete dialog opens once, on the last answer", async ({
  page,
}) => {
  const allKeys = chapters.flatMap((chapter) => questionKeys(chapter.slug));
  const lastKey = "smart-contracts:2";
  await seedProgress(
    page,
    allKeys.filter((key) => key !== lastKey),
  );

  await openChapter(page, "smart-contracts");
  await expect(progressStatus(page, getTotalQuizQuestions() - 1)).toBeVisible();

  const dialog = page.getByRole("alertdialog", { name: "You're done" });
  await expect(dialog).toHaveCount(0);

  await answerCorrectly(page, "smart-contracts", 2);
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Nice" }).click();
  await expect(dialog).toBeHidden();

  await page.reload();
  await expect(progressStatus(page, getTotalQuizQuestions())).toBeVisible();
  await expect(dialog).toHaveCount(0);
});

for (const [label, raw] of [
  ["invalid JSON", "not json"],
  ["unknown keys", JSON.stringify(["nope:0", "what-is-blockchain:99", 7])],
] as const) {
  test(`corrupt progress (${label}) loads as zero`, async ({ page }) => {
    await seedProgress(page, raw);
    await openChapter(page, "what-is-blockchain");
    await expect(progressStatus(page, 0)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Quick check" }),
    ).toBeVisible();
  });
}
