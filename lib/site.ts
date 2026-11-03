import type { Route } from "next";

import type { ChapterSlug } from "@/lib/course";

const fallbackUrl = "http://localhost:3000";

export const siteConfig = {
  name: "Blocklearn",
  title: "Blocklearn",
  description:
    "Change the diagrams in a short course on shared ledgers, hashes, consensus, transactions, and smart contracts.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? fallbackUrl).replace(/\/$/, ""),
  locale: "en_US",
} as const;

export function absoluteUrl(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${normalized}`;
}

export function chapterPath<T extends ChapterSlug>(slug: T) {
  return `/chapters/${slug}` as Route<`/chapters/${T}`>;
}

export const siteOgImage = {
  url: "/images/og.jpg",
  width: 1280,
  height: 720,
  alt: "Blocklearn",
} as const;
