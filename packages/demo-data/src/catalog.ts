import type { TestCatalog } from "@lab/contracts";

// A realistic starter catalog spanning the core departments with clinically
// plausible reference ranges and regional list pricing. Prices are list/base;
// individual tenants can override per their fee schedule.
export const testCatalog: TestCatalog = {
  currencies: ["PKR", "SAR", "AED", "GBP", "USD"],
  tests: [
    // ---- Hematology ----
    {
      code: "CBC",
      name: "Complete Blood Count (CBC)",
      department: "hematology",
      specimen: "Whole blood (EDTA)",
      method: "Automated impedance + flow cytometry",
      loinc: "58410-2",
      referenceRange: "See component ranges",
      tatHours: 4,
      prices: { PKR: 1200, SAR: 45, AED: 48, GBP: 18, USD: 22 },
      isPanel: true,
      panelTests: ["HGB", "WBC", "PLT"],
      popular: true
    },
    {
      code: "HGB",
      name: "Hemoglobin",
      department: "hematology",
      specimen: "Whole blood (EDTA)",
      referenceRange: "M 13.0–17.0 · F 12.0–15.5",
      unit: "g/dL",
      tatHours: 4,
      prices: { PKR: 400, SAR: 18, AED: 19, GBP: 8, USD: 9 }
    },
    {
      code: "WBC",
      name: "White Blood Cell Count",
      department: "hematology",
      specimen: "Whole blood (EDTA)",
      referenceRange: "4.0–11.0",
      unit: "10³/µL",
      tatHours: 4,
      prices: { PKR: 400, SAR: 18, AED: 19, GBP: 8, USD: 9 }
    },
    {
      code: "PLT",
      name: "Platelet Count",
      department: "hematology",
      specimen: "Whole blood (EDTA)",
      referenceRange: "150–410",
      unit: "10³/µL",
      tatHours: 4,
      prices: { PKR: 400, SAR: 18, AED: 19, GBP: 8, USD: 9 }
    },
    {
      code: "ESR",
      name: "Erythrocyte Sedimentation Rate",
      department: "hematology",
      specimen: "Whole blood (EDTA)",
      method: "Westergren",
      referenceRange: "M 0–15 · F 0–20",
      unit: "mm/hr",
      tatHours: 4,
      prices: { PKR: 600, SAR: 20, AED: 22, GBP: 9, USD: 11 }
    },
    {
      code: "PTINR",
      name: "Prothrombin Time / INR",
      department: "hematology",
      specimen: "Citrated plasma",
      referenceRange: "INR 0.8–1.2",
      tatHours: 4,
      prices: { PKR: 1500, SAR: 55, AED: 58, GBP: 22, USD: 26 }
    },

    // ---- Biochemistry ----
    {
      code: "FBS",
      name: "Fasting Blood Glucose",
      department: "biochemistry",
      specimen: "Fluoride plasma",
      loinc: "1558-6",
      referenceRange: "70–100",
      unit: "mg/dL",
      tatHours: 3,
      prices: { PKR: 500, SAR: 18, AED: 20, GBP: 8, USD: 9 },
      popular: true
    },
    {
      code: "LIPID",
      name: "Lipid Profile",
      department: "biochemistry",
      specimen: "Serum (fasting)",
      referenceRange: "See component ranges",
      tatHours: 6,
      prices: { PKR: 2500, SAR: 80, AED: 85, GBP: 32, USD: 38 },
      isPanel: true,
      panelTests: ["CHOL", "HDL", "LDL", "TRIG"],
      popular: true
    },
    {
      code: "CHOL",
      name: "Total Cholesterol",
      department: "biochemistry",
      specimen: "Serum",
      referenceRange: "< 200",
      unit: "mg/dL",
      tatHours: 6,
      prices: { PKR: 800, SAR: 28, AED: 30, GBP: 11, USD: 13 }
    },
    {
      code: "HDL",
      name: "HDL Cholesterol",
      department: "biochemistry",
      specimen: "Serum",
      referenceRange: "> 40",
      unit: "mg/dL",
      tatHours: 6,
      prices: { PKR: 800, SAR: 28, AED: 30, GBP: 11, USD: 13 }
    },
    {
      code: "LDL",
      name: "LDL Cholesterol",
      department: "biochemistry",
      specimen: "Serum",
      referenceRange: "< 100",
      unit: "mg/dL",
      tatHours: 6,
      prices: { PKR: 800, SAR: 28, AED: 30, GBP: 11, USD: 13 }
    },
    {
      code: "TRIG",
      name: "Triglycerides",
      department: "biochemistry",
      specimen: "Serum (fasting)",
      referenceRange: "< 150",
      unit: "mg/dL",
      tatHours: 6,
      prices: { PKR: 800, SAR: 28, AED: 30, GBP: 11, USD: 13 }
    },
    {
      code: "LFT",
      name: "Liver Function Tests (LFT)",
      department: "biochemistry",
      specimen: "Serum",
      referenceRange: "See component ranges",
      tatHours: 6,
      prices: { PKR: 2800, SAR: 90, AED: 95, GBP: 36, USD: 42 },
      isPanel: true,
      panelTests: ["ALT", "AST", "ALP", "TBIL"]
    },
    {
      code: "ALT",
      name: "Alanine Aminotransferase (ALT)",
      department: "biochemistry",
      specimen: "Serum",
      referenceRange: "M 7–55 · F 7–45",
      unit: "U/L",
      tatHours: 6,
      prices: { PKR: 900, SAR: 30, AED: 32, GBP: 12, USD: 14 }
    },
    {
      code: "AST",
      name: "Aspartate Aminotransferase (AST)",
      department: "biochemistry",
      specimen: "Serum",
      referenceRange: "8–48",
      unit: "U/L",
      tatHours: 6,
      prices: { PKR: 900, SAR: 30, AED: 32, GBP: 12, USD: 14 }
    },
    {
      code: "ALP",
      name: "Alkaline Phosphatase",
      department: "biochemistry",
      specimen: "Serum",
      referenceRange: "40–129",
      unit: "U/L",
      tatHours: 6,
      prices: { PKR: 900, SAR: 30, AED: 32, GBP: 12, USD: 14 }
    },
    {
      code: "TBIL",
      name: "Total Bilirubin",
      department: "biochemistry",
      specimen: "Serum",
      referenceRange: "0.3–1.2",
      unit: "mg/dL",
      tatHours: 6,
      prices: { PKR: 700, SAR: 24, AED: 26, GBP: 10, USD: 12 }
    },
    {
      code: "RFT",
      name: "Renal Function Tests (RFT)",
      department: "biochemistry",
      specimen: "Serum",
      referenceRange: "See component ranges",
      tatHours: 6,
      prices: { PKR: 2600, SAR: 85, AED: 90, GBP: 34, USD: 40 },
      isPanel: true,
      panelTests: ["UREA", "CREAT"]
    },
    {
      code: "UREA",
      name: "Blood Urea",
      department: "biochemistry",
      specimen: "Serum",
      referenceRange: "15–40",
      unit: "mg/dL",
      tatHours: 6,
      prices: { PKR: 700, SAR: 24, AED: 26, GBP: 10, USD: 12 }
    },
    {
      code: "CREAT",
      name: "Serum Creatinine",
      department: "biochemistry",
      specimen: "Serum",
      referenceRange: "M 0.7–1.3 · F 0.6–1.1",
      unit: "mg/dL",
      tatHours: 6,
      prices: { PKR: 700, SAR: 24, AED: 26, GBP: 10, USD: 12 }
    },

    // ---- Endocrinology ----
    {
      code: "HBA1C",
      name: "Glycated Hemoglobin (HbA1c)",
      department: "endocrinology",
      specimen: "Whole blood (EDTA)",
      method: "HPLC",
      loinc: "4548-4",
      referenceRange: "Non-diabetic < 5.7 · Diabetic ≥ 6.5",
      unit: "%",
      tatHours: 8,
      prices: { PKR: 2200, SAR: 70, AED: 75, GBP: 28, USD: 33 },
      popular: true
    },
    {
      code: "TSH",
      name: "Thyroid Stimulating Hormone",
      department: "endocrinology",
      specimen: "Serum",
      method: "CLIA",
      referenceRange: "0.4–4.0",
      unit: "mIU/L",
      tatHours: 12,
      prices: { PKR: 1800, SAR: 60, AED: 64, GBP: 24, USD: 28 },
      popular: true
    },
    {
      code: "VITD",
      name: "Vitamin D (25-OH)",
      department: "endocrinology",
      specimen: "Serum",
      method: "CLIA",
      referenceRange: "Sufficient 30–100",
      unit: "ng/mL",
      tatHours: 24,
      prices: { PKR: 3500, SAR: 120, AED: 128, GBP: 48, USD: 56 }
    },
    {
      code: "FERR",
      name: "Ferritin",
      department: "immunology",
      specimen: "Serum",
      method: "CLIA",
      referenceRange: "M 30–400 · F 13–150",
      unit: "ng/mL",
      tatHours: 12,
      prices: { PKR: 2400, SAR: 78, AED: 82, GBP: 30, USD: 36 }
    },

    // ---- Immunology / Serology ----
    {
      code: "CRP",
      name: "C-Reactive Protein (CRP)",
      department: "immunology",
      specimen: "Serum",
      referenceRange: "< 6",
      unit: "mg/L",
      tatHours: 6,
      prices: { PKR: 1500, SAR: 50, AED: 54, GBP: 20, USD: 24 }
    },
    {
      code: "HBSAG",
      name: "Hepatitis B Surface Antigen",
      department: "immunology",
      specimen: "Serum",
      method: "CLIA",
      referenceRange: "Non-reactive",
      tatHours: 24,
      prices: { PKR: 1800, SAR: 60, AED: 64, GBP: 24, USD: 28 }
    },

    // ---- Microbiology ----
    {
      code: "URINEC",
      name: "Urine Culture & Sensitivity",
      department: "microbiology",
      specimen: "Midstream urine (sterile)",
      method: "Culture",
      referenceRange: "No significant growth",
      tatHours: 72,
      prices: { PKR: 2200, SAR: 72, AED: 76, GBP: 28, USD: 33 }
    },

    // ---- Molecular ----
    {
      code: "PCRCOV",
      name: "SARS-CoV-2 RT-PCR",
      department: "molecular",
      specimen: "Nasopharyngeal swab (VTM)",
      method: "RT-PCR",
      referenceRange: "Not detected",
      tatHours: 24,
      prices: { PKR: 4500, SAR: 150, AED: 160, GBP: 60, USD: 70 }
    },

    // ---- Histopathology ----
    {
      code: "HISTO",
      name: "Histopathology — Small Specimen",
      department: "histopathology",
      specimen: "Tissue in 10% formalin",
      method: "H&E microscopy",
      referenceRange: "Descriptive report",
      tatHours: 96,
      prices: { PKR: 5000, SAR: 170, AED: 180, GBP: 68, USD: 80 }
    }
  ]
};

export function findTest(code: string) {
  return testCatalog.tests.find((test) => test.code === code);
}
