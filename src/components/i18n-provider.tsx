"use client";

import React, { createContext, useContext } from "react";
import { Dictionary, Locale, getDictionary } from "@/lib/i18n";

type I18nContextType = {
  t: Dictionary;
  locale: Locale;
};

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider = ({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) => {
  const dictionary = getDictionary(locale);

  return (
    <I18nContext.Provider value={{ t: dictionary, locale }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};
