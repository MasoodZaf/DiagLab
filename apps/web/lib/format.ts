// Clinical/financial values use Latin digits regardless of locale so numbers
// stay unambiguous; dates follow the active locale's conventions.

export function formatMoney(amount: number, currency: string, intlLocale = "en") {
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    numberingSystem: "latn"
  }).format(amount);
}

export function formatNumber(value: number, intlLocale = "en") {
  return new Intl.NumberFormat(intlLocale, { numberingSystem: "latn" }).format(value);
}

export function formatDateTime(value?: string, intlLocale = "en", timeZone?: string) {
  if (!value) {
    return undefined;
  }

  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
    numberingSystem: "latn"
  }).format(new Date(value));
}

export function formatDate(value?: string, intlLocale = "en", timeZone?: string) {
  if (!value) {
    return undefined;
  }

  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeZone,
    numberingSystem: "latn"
  }).format(new Date(value));
}
