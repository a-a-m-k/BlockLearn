import { expect, test } from "@playwright/test";

import { openChapter } from "./helpers";

test.use({ reducedMotion: "reduce" });

test("a broadcast still lands on every shared copy", async ({ page }) => {
  await openChapter(page, "what-is-blockchain");

  const stage = page.getByRole("figure", { name: /Distributed notebooks/ });
  await page.getByRole("button", { name: "Broadcast Alex → Alice $8" }).click();

  await expect(
    stage.getByRole("listitem").filter({ hasText: "Alex → Alice" }),
  ).toHaveCount(4, { timeout: 10_000 });
});

const finishedNotice = "Animation is off, so this shows the finished result.";

test("Proof of Stake shows the picked validator without playing", async ({
  page,
}) => {
  await openChapter(page, "consensus");

  await page.getByRole("button", { name: "Proof of Stake" }).click();

  await expect(page.getByText("Alice is selected!")).toBeVisible();
  await expect(page.getByText(finishedNotice).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Play demo" })).toHaveCount(0);
});

test("the transaction shows every step through the block", async ({ page }) => {
  await openChapter(page, "transactions");

  const figure = page.getByRole("figure", {
    name: /Create a transaction from Alice to Bob/,
  });

  await expect(figure.getByRole("status")).toHaveText(finishedNotice);
  for (const step of ["Signed", "Broadcast to network", "In mempool", "Added to block"]) {
    await expect(figure.getByRole("heading", { name: step, level: 3 })).toBeVisible();
  }
  await expect(figure.getByRole("button", { name: "Sign & send" })).toHaveCount(0);
});

test("the staking lock still returns the ETH", async ({ page }) => {
  await openChapter(page, "smart-contracts");

  const figure = page.getByRole("figure", {
    name: "Staking lock smart contract",
  });
  await figure.getByRole("button", { name: "10 days later" }).click();
  await figure.getByRole("button", { name: "Try to withdraw" }).click();

  await expect(figure.getByRole("status")).toContainText(
    "ETH returned to Alice",
  );
});
