import { useRouterState } from "@tanstack/react-router";
import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type LazySectionProps = {
  load: () => Promise<{ default: ComponentType }>;
  fallback?: ReactNode;
  rootMargin?: string;
  sectionId?: string;
};

function hashMatchesSection(sectionId: string): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hash.replace(/^#/, "") === sectionId;
}

export function LazySection({
  load,
  fallback = null,
  rootMargin = "320px",
  sectionId,
}: LazySectionProps) {
  const routerHash = useRouterState({ select: (state) => state.location.hash });
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(() =>
    sectionId ? hashMatchesSection(sectionId) : false,
  );
  const LazyComponent = lazy(load);

  const routerHashId = routerHash?.replace(/^#/, "") ?? "";
  const routerHashMatches = sectionId ? routerHashId === sectionId : false;

  useEffect(() => {
    if (routerHashMatches) setShouldLoad(true);
  }, [routerHashMatches]);

  useEffect(() => {
    if (!sectionId) return;

    const syncHash = () => {
      if (hashMatchesSection(sectionId)) setShouldLoad(true);
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [sectionId]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || shouldLoad) return;

    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, shouldLoad]);

  return (
    <div
      ref={containerRef}
      id={sectionId}
      className={cn(sectionId && "scroll-mt-28")}
    >
      {shouldLoad ? (
        <Suspense fallback={fallback}>
          <LazyComponent />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}
