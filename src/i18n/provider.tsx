import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { defaultLocale, localeToIntl, type SupportedLocale } from "@/i18n/config";
import { detectClientLocale } from "@/i18n/detect-locale";
import { getMessages, type Messages } from "@/i18n/messages";

type I18nContextValue = {
  locale: SupportedLocale;
  messages: Messages;
  intlLocale: string;
  setLocale: (locale: SupportedLocale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  children: ReactNode;
  initialLocale?: SupportedLocale;
};

function resolveInitialLocale(serverLocale: SupportedLocale): SupportedLocale {
  if (typeof window === "undefined") return serverLocale;
  window.localStorage.removeItem("quickkey-locale");
  return detectClientLocale();
}

export function I18nProvider({ children, initialLocale = defaultLocale }: I18nProviderProps) {
  const [locale, setLocale] = useState<SupportedLocale>(() => resolveInitialLocale(initialLocale));

  useEffect(() => {
    const syncLocale = () => {
      window.localStorage.removeItem("quickkey-locale");
      const detected = detectClientLocale();
      setLocale(detected);
      document.documentElement.lang = detected;
    };

    syncLocale();
    window.addEventListener("languagechange", syncLocale);
    return () => window.removeEventListener("languagechange", syncLocale);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      messages: getMessages(locale),
      intlLocale: localeToIntl[locale],
      setLocale: (nextLocale) => {
        document.documentElement.lang = nextLocale;
        setLocale(nextLocale);
      },
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
