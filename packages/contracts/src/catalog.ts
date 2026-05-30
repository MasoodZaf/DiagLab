export const catalogCurrencies = ["PKR", "SAR", "AED", "GBP", "USD"] as const;
export type CatalogCurrency = (typeof catalogCurrencies)[number];

export const catalogDepartments = [
  "hematology",
  "biochemistry",
  "immunology",
  "microbiology",
  "molecular",
  "histopathology",
  "endocrinology"
] as const;
export type CatalogDepartment = (typeof catalogDepartments)[number];

export type CatalogTest = {
  /** Short clinical code used on requisitions and barcodes, e.g. "HBA1C". */
  code: string;
  name: string;
  department: CatalogDepartment;
  /** Specimen + container, e.g. "Whole blood (EDTA)". */
  specimen: string;
  method?: string;
  loinc?: string;
  /** Human-readable reference range; sex/age qualifiers inline. */
  referenceRange: string;
  unit?: string;
  /** Routine turnaround time in hours. */
  tatHours: number;
  /** List price per currency (tenant-overridable). */
  prices: Partial<Record<CatalogCurrency, number>>;
  /** True for grouped panels; panelTests holds the member codes. */
  isPanel?: boolean;
  panelTests?: string[];
  /** Surfaced first in patient-facing booking. */
  popular?: boolean;
};

export type TestCatalog = {
  currencies: CatalogCurrency[];
  tests: CatalogTest[];
};
