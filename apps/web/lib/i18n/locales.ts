export const locales = ["en", "ar"] as const;

export type Locale = (typeof locales)[number];

export type Direction = "ltr" | "rtl";

type LocaleMeta = {
  /** Locale code used in the app + URL (?lang=). */
  code: Locale;
  /** Text direction for the language. */
  dir: Direction;
  /** English label for menus / accessibility. */
  englishName: string;
  /** Native label shown in the language switcher. */
  nativeName: string;
  /** BCP-47 tag used for Intl number/date formatting. */
  intlLocale: string;
  /** Font stack tuned for the script (overrides tenant body font when set). */
  fontStack?: string;
};

export const localeMeta: Record<Locale, LocaleMeta> = {
  en: {
    code: "en",
    dir: "ltr",
    englishName: "English",
    nativeName: "English",
    intlLocale: "en"
  },
  ar: {
    code: "ar",
    dir: "rtl",
    englishName: "Arabic",
    nativeName: "العربية",
    intlLocale: "ar-SA",
    fontStack: '"Noto Naskh Arabic", "Geeza Pro", "Segoe UI", system-ui, sans-serif'
  }
};

export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function directionOf(locale: Locale): Direction {
  return localeMeta[locale].dir;
}

export function isRtl(locale: Locale): boolean {
  return localeMeta[locale].dir === "rtl";
}
