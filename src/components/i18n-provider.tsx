"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Dictionary, Locale, getDictionary } from "@/lib/i18n";

type I18nContextType = {
  t: Dictionary;
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>("en"); // Default language: English

  useEffect(() => {
    const savedLocale = localStorage.getItem("app_locale") as Locale;
    if (savedLocale && (savedLocale === "en" || savedLocale === "tr")) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("app_locale", newLocale);
    document.cookie = `app_locale=${newLocale}; path=/; max-age=31536000`;
  };

  const dictionary = getDictionary(locale);

  return (
    <I18nContext.Provider value={{ t: dictionary, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    // Return a safe fallback if accessed outside provider during SSR/initialization
    const fallbackDict = getDictionary("en");
    return { t: fallbackDict, locale: "en" as Locale, setLocale: () => {} };
  }
  return context;
};
