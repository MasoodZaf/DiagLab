import type { Dictionary } from "./dictionaries/en";

/**
 * A locale dictionary that mirrors the English structure but: (a) makes every
 * key optional (locales may omit keys and fall back to English) and (b) widens
 * string-literal leaves to `string` so translated values are accepted.
 */
export type PartialDictionary = DeepPartialWiden<Dictionary>;

type DeepPartialWiden<T> = T extends string
  ? string
  : { [K in keyof T]?: DeepPartialWiden<T[K]> };
