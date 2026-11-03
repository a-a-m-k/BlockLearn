"use client";

import { useEffect } from "react";

function isModifiedClick(event: MouseEvent) {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function findInternalAnchor(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;

  const anchor = target.closest("a");
  if (!anchor || anchor.hasAttribute("download")) return null;
  if (anchor.target && anchor.target !== "_self") return null;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return null;

  return anchor;
}

function sameDocumentUrl(url: URL) {
  return (
    url.pathname === window.location.pathname &&
    url.search === window.location.search
  );
}

function resolveSameOriginUrl(anchor: HTMLAnchorElement) {
  try {
    const url = new URL(anchor.href);
    if (url.origin !== window.location.origin) return null;
    if (sameDocumentUrl(url)) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Forces same-origin link clicks to full page loads. Needed when
 * NEXT_PUBLIC_FIGMA_MAKE=1: Figma Make's preview returns HTML for Next.js
 * client navigations, which the app router then fails to parse.
 */
export function FullPageLinkNavigation() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_FIGMA_MAKE !== "1") return;

    function onClick(event: MouseEvent) {
      if (isModifiedClick(event)) return;

      const anchor = findInternalAnchor(event.target);
      if (!anchor) return;

      const url = resolveSameOriginUrl(anchor);
      if (!url) return;

      event.preventDefault();
      event.stopPropagation();
      window.location.assign(url.href);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
