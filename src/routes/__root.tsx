import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense, type ReactNode, useEffect, useState } from "react";

import { STICKY_TRUST_OFFSET_CLASS } from "@/components/sticky-trust-strip";
import { ScrollToTop } from "@/components/scroll-to-top";
import { ThemeProvider } from "@/components/theme-provider";
import { defaultLocale, localeToIntl, supportedLocales, type SupportedLocale } from "@/i18n/config";
import { detectClientLocale, detectLocale } from "@/i18n/detect-locale";
import { getMessages } from "@/i18n/messages";
import { AuthProvider } from "@/features/account/auth-provider";
import { I18nProvider } from "@/i18n/provider";
import { SITE_METADATA } from "@/lib/site-metadata";
import { defaultThemeId, THEME_STORAGE_KEY } from "@/lib/themes";
import type { RouterContext } from "@/router";

import appCss from "../styles.css?url";

const scrollBootstrapScript = `(function(){try{if("scrollRestoration"in history)history.scrollRestoration="manual";if(!location.hash)window.scrollTo(0,0);}catch(e){}})();`;

const themeBootstrapScript = `(function(){try{document.documentElement.setAttribute("data-theme","${defaultThemeId}");localStorage.setItem("${THEME_STORAGE_KEY}","${defaultThemeId}");}catch(e){}})();`;

const localeBootstrapScript = `(function(){try{localStorage.removeItem("quickkey-locale");var s=${JSON.stringify(supportedLocales)};var langs=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||"en"];for(var i=0;i<langs.length;i++){var v=(langs[i]||"").toLowerCase();var l=v==="pap"||v.indexOf("pap-")===0?"pap":v==="pt"||v.indexOf("pt-")===0?"pt":v.split("-")[0];if(s.indexOf(l)!==-1){document.documentElement.lang=l;break;}}}catch(e){}})();`;

const ContactFab = lazy(() =>
  import("@/components/contact-fab").then((module) => ({ default: module.ContactFab })),
);

const StickyTrustStrip = lazy(() =>
  import("@/components/sticky-trust-strip").then((module) => ({
    default: module.StickyTrustStrip,
  })),
);

function DeferredContactFab() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const idle =
      window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(cb, 1));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = idle(() => setReady(true), { timeout: 2500 });
    return () => cancel(id);
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <ContactFab />
    </Suspense>
  );
}

async function resolveRequestLocale(): Promise<SupportedLocale> {
  if (import.meta.env.SSR) {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    return detectLocale(getRequestHeader("accept-language"));
  }
  return detectClientLocale();
}

function NotFoundComponent() {
  const locale = detectClientLocale();
  const messages = getMessages(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          {messages.errors.notFoundTitle}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{messages.errors.notFoundBody}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {messages.common.goHome}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const locale = detectClientLocale();
  const messages = getMessages(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {messages.errors.loadTitle}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{messages.errors.loadBody}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {messages.common.tryAgain}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {messages.common.goHome}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const locale = await resolveRequestLocale();
    return { locale };
  },
  head: ({ match }) => {
    const locale = (match.context.locale as SupportedLocale) ?? defaultLocale;
    const messages = getMessages(locale);

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: SITE_METADATA.themeColor },
        { title: messages.meta.siteTitle },
        { name: "description", content: messages.meta.siteDescription },
        { property: "og:title", content: messages.meta.ogTitle },
        { property: "og:description", content: messages.meta.ogDescription },
        { property: "og:type", content: "website" },
        { property: "og:url", content: SITE_METADATA.url },
        { property: "og:site_name", content: SITE_METADATA.name },
        { property: "og:image", content: SITE_METADATA.ogImage },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: SITE_METADATA.ogImageAlt },
        { property: "og:locale", content: localeToIntl[locale].replace("-", "_") },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: messages.meta.ogTitle },
        { name: "twitter:description", content: messages.meta.ogDescription },
        { name: "twitter:image", content: SITE_METADATA.ogImage },
        { name: "twitter:image:alt", content: SITE_METADATA.ogImageAlt },
      ],
      links: [
        { rel: "canonical", href: SITE_METADATA.url },
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap",
          media: "print",
          onLoad: "this.media='all'",
        },
        { rel: "stylesheet", href: appCss },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const locale = useRouterState({
    select: (state) =>
      (state.matches.find((match) => match.routeId === "__root__")?.context.locale as
        | SupportedLocale
        | undefined) ?? defaultLocale,
  });

  return (
    <html lang={locale} data-theme={defaultThemeId}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scrollBootstrapScript }} />
        <script dangerouslySetInnerHTML={{ __html: localeBootstrapScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient, locale } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");
  const isAccount = pathname.startsWith("/account");
  const showPublicChrome = !isAdmin && !isAccount;

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider initialLocale={locale}>
        <AuthProvider>
          <ThemeProvider>
            <ScrollToTop />
            <div
              className={`${showPublicChrome ? STICKY_TRUST_OFFSET_CLASS : ""} w-full overflow-x-clip`}
            >
              <Outlet />
            </div>
            {showPublicChrome ? (
              <>
                <Suspense fallback={null}>
                  <StickyTrustStrip />
                </Suspense>
                <DeferredContactFab />
              </>
            ) : null}
          </ThemeProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
