import { en } from "@/dictionaries/en";
import { tr } from "@/dictionaries/tr";

export type Dictionary = typeof en;
export type Locale = "en" | "tr";

const dictionaries = {
  en,
  tr,
};

export const getDictionary = (locale: Locale): Dictionary => {
  return dictionaries[locale] || dictionaries["en"];
};
