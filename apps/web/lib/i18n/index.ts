import { en } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";
import { localeMeta, resolveLocale, type Locale } from "./locales";
import type { PartialDictionary } from "./types";

export * from "./locales";
export type { Dictionary } from "./dictionaries/en";
export type { PartialDictionary } from "./types";

type Vars = Record<string, string | number>;

const dictionaries: Record<Locale, PartialDictionary> = {
  en,
  ar
};

function lookup(source: unknown, path: string[]): string | undefined {
  let current: unknown = source;
  for (const segment of path) {
    if (current && typeof current === "object" && segment in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) {
    return template;
  }
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{{${key}}}`
  );
}

export type Translator = (key: string, vars?: Vars) => string;

/**
 * Returns a translator for the given locale. Falls back to English, then to
 * the raw key. Safe to call in both server and client components.
 */
export function getTranslator(locale: Locale): Translator {
  const primary = dictionaries[locale] ?? en;
  return (key, vars) => {
    const path = key.split(".");
    const value = lookup(primary, path) ?? lookup(en, path) ?? key;
    return interpolate(value, vars);
  };
}

export type Localization = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Translator;
  /** BCP-47 tag for Intl formatting. */
  intlLocale: string;
};

/** Resolve everything a surface needs from a raw `?lang=` value. */
export function getLocalization(rawLocale: unknown): Localization {
  const locale = resolveLocale(rawLocale);
  const meta = localeMeta[locale];
  return {
    locale,
    dir: meta.dir,
    intlLocale: meta.intlLocale,
    t: getTranslator(locale)
  };
}
