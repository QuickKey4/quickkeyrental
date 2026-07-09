import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { scrollToSectionWithRetry } from "@/lib/scroll-to-section";

export function ScrollToTop() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const hash = useRouterState({ select: (state) => state.location.hash });

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const hashId = (hash || window.location.hash).replace(/^#/, "");

    if (!hashId) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }

    return scrollToSectionWithRetry(hashId, pathname === "/" ? "smooth" : "instant");
  }, [pathname, hash]);

  return null;
}
