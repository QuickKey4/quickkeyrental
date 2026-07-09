import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { defaultLocale, type SupportedLocale } from "@/i18n/config";
import { routeTree } from "./routeTree.gen";

export type RouterContext = {
  queryClient: QueryClient;
  locale: SupportedLocale;
};

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient, locale: defaultLocale },
    scrollRestoration: false,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
