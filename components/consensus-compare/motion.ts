/** Shared Motion springs for the consensus compare demos. */
export const springPop = {
  type: "spring" as const,
  bounce: 0.2,
  visualDuration: 0.35,
};

export const springHighlight = {
  type: "spring" as const,
  bounce: 0.2,
  visualDuration: 0.3,
};

/** Opacity-only or opacity+transform enter/exit props for reduced motion. */
export function popMotion(
  reduced: boolean | null,
  hidden: string,
  shown: string,
) {
  if (reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: springPop,
    };
  }

  return {
    initial: { opacity: 0, transform: hidden },
    animate: { opacity: 1, transform: shown },
    exit: { opacity: 0, transform: hidden },
    transition: springPop,
  };
}
