import { expect, type Locator, type Page } from "@playwright/test";

import type { ChapterSlug } from "../lib/course";
import {
  getQuizQuestionCount,
  getTotalQuizQuestions,
  quizQuestionKey,
} from "../lib/quiz-meta";
import { getQuizByChapterSlug } from "../lib/quizzes";

export const PROGRESS_STORAGE_KEY = "blocklearn:completed-questions";

export async function openChapter(page: Page, slug: string) {
  await page.goto(`/chapters/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

export function quizQuestion(slug: ChapterSlug, index: number) {
  const question = getQuizByChapterSlug(slug).questions[index];
  if (!question) throw new Error(`no question ${index} in ${slug}`);
  return question;
}

export function quizGroup(page: Page, slug: ChapterSlug, index: number) {
  return page.getByRole("radiogroup", {
    name: quizQuestion(slug, index).question,
  });
}

function optionText(slug: ChapterSlug, index: number, correct: boolean) {
  const question = quizQuestion(slug, index);
  const option = question.options.find((candidate) =>
    correct
      ? candidate.id === question.correctOptionId
      : candidate.id !== question.correctOptionId,
  );
  if (!option) throw new Error(`no option for ${slug}:${index}`);
  return option.text;
}

export function correctOption(page: Page, slug: ChapterSlug, index: number) {
  return quizGroup(page, slug, index).getByRole("radio", {
    name: optionText(slug, index, true),
  });
}

export function wrongOption(page: Page, slug: ChapterSlug, index: number) {
  return quizGroup(page, slug, index).getByRole("radio", {
    name: optionText(slug, index, false),
  });
}

export async function answerCorrectly(
  page: Page,
  slug: ChapterSlug,
  index: number,
) {
  await correctOption(page, slug, index).click();
}

export function questionKeys(slug: ChapterSlug) {
  return Array.from({ length: getQuizQuestionCount(slug) }, (_, index) =>
    quizQuestionKey(slug, index),
  );
}

/** Seeds storage once per tab, so a reload does not undo a reset. */
export async function seedProgress(page: Page, value: readonly string[] | string) {
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  await page.addInitScript(
    ({ key, raw }) => {
      if (sessionStorage.getItem("e2e:seeded")) return;
      localStorage.setItem(key, raw);
      sessionStorage.setItem("e2e:seeded", "1");
    },
    { key: PROGRESS_STORAGE_KEY, raw },
  );
}

export function progressStatus(page: Page, completed: number): Locator {
  return page.getByRole("status").filter({
    hasText: `${completed} of ${getTotalQuizQuestions()} questions complete`,
  });
}
