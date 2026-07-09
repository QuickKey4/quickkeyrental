const MAX_ATTEMPTS = 40;
const RETRY_MS = 100;

export function scrollToSection(id: string, behavior: ScrollBehavior = "smooth"): boolean {
  const element = document.getElementById(id);
  if (!element) return false;
  element.scrollIntoView({ behavior, block: "start" });
  return true;
}

export function scrollToSectionWithRetry(
  id: string,
  behavior: ScrollBehavior = "smooth",
): () => void {
  let cancelled = false;
  let attempts = 0;

  const tryScroll = () => {
    if (cancelled) return;
    if (scrollToSection(id, behavior)) return;
    if (attempts++ < MAX_ATTEMPTS) {
      window.setTimeout(tryScroll, RETRY_MS);
    }
  };

  tryScroll();

  return () => {
    cancelled = true;
  };
}

export function hashFromHref(href: string): string | null {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return null;
  return href.slice(hashIndex + 1) || null;
}

export function pathFromHref(href: string): string {
  const hashIndex = href.indexOf("#");
  const path = hashIndex === -1 ? href : href.slice(0, hashIndex);
  return path || "/";
}
