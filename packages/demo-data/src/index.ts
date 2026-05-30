import { roleCapabilities, type SessionActor, type TenantSnapshot } from "@lab/contracts";

export * from "./catalog";
export * from "./org";
export * from "./platform";

function createActor(id: string, tenantId: string, role: SessionActor["role"], displayName: string, branchName?: string): SessionActor {
  const capabilities = roleCapabilities.find((entry) => entry.role === role)?.capabilities ?? [];

  return {
    id,
    tenantId,
    role,
    displayName,
    branchName,
    capabilities
  };
}

export const sessionActors: Record<string, SessionActor[]> = {
  tenant_lumen: [
    createActor("sess_lumen_patient", "tenant_lumen", "patient", "Areeba Khan"),
    createActor("sess_lumen_reception", "tenant_lumen", "receptionist", "Sana Waheed", "Gulberg"),
    createActor("sess_lumen_phleb", "tenant_lumen", "phlebotomist", "Bilal Ahmed", "Gulberg"),
    createActor("sess_lumen_tech", "tenant_lumen", "technician", "Usman Tariq", "Central Lab"),
    createActor("sess_lumen_path", "tenant_lumen", "pathologist", "Dr. Mehak Ali", "Central Lab")
  ],
  tenant_cedar: [
    createActor("sess_cedar_patient", "tenant_cedar", "patient", "Sophia Reed"),
    createActor("sess_cedar_reception", "tenant_cedar", "receptionist", "Clare Mason", "London City"),
    createActor("sess_cedar_phleb", "tenant_cedar", "phlebotomist", "Maya Ellis", "London City"),
    createActor("sess_cedar_tech", "tenant_cedar", "technician", "Ibrahim Nadeem", "Core Bench"),
    createActor("sess_cedar_path", "tenant_cedar", "pathologist", "Dr. Hannah Cole", "Core Bench")
  ]
};

export const tenantSnapshots: Record<string, TenantSnapshot> = {
  tenant_lumen: {
    tenantId: "tenant_lumen",
    patients: [
      {
        id: "pat_lum_1",
        tenantId: "tenant_lumen",
        mrn: "LM-240218",
        fullName: "Areeba Khan",
        phone: "+92 300 555 0101",
        nationalId: "35202-1234567-8",
        dateOfBirth: "1994-06-16",
        sex: "female",
        consentedAt: "2026-05-26T08:11:00Z",
        createdAt: "2026-05-26T08:11:00Z",
        updatedAt: "2026-05-26T08:11:00Z",
        createdBy: "Sana Waheed",
        updatedBy: "Sana Waheed"
      },
      {
        id: "pat_lum_2",
        tenantId: "tenant_lumen",
        mrn: "LM-240219",
        fullName: "Faisal Raza",
        phone: "+92 301 555 1112",
        nationalId: "35202-2345678-9",
        dateOfBirth: "1988-02-12",
        sex: "male",
        consentedAt: "2026-05-26T08:35:00Z",
        createdAt: "2026-05-26T08:35:00Z",
        updatedAt: "2026-05-26T08:35:00Z",
        createdBy: "Sana Waheed",
        updatedBy: "Sana Waheed"
      },
      {
        id: "pat_lum_3",
        tenantId: "tenant_lumen",
        mrn: "LM-240220",
        fullName: "Hassan Iqbal",
        phone: "+92 302 555 2233",
        nationalId: "35202-3456789-0",
        dateOfBirth: "1979-11-03",
        sex: "male",
        consentedAt: "2026-05-27T09:40:00Z",
        createdAt: "2026-05-27T09:40:00Z",
        updatedAt: "2026-05-27T09:40:00Z",
        createdBy: "Ayesha Noor",
        updatedBy: "Ayesha Noor"
      },
      {
        id: "pat_lum_4",
        tenantId: "tenant_lumen",
        mrn: "LM-240221",
        fullName: "Nadia Saleem",
        phone: "+92 303 555 3344",
        nationalId: "35202-4567890-1",
        dateOfBirth: "1990-07-21",
        sex: "female",
        consentedAt: "2026-05-25T07:15:00Z",
        createdAt: "2026-05-25T07:15:00Z",
        updatedAt: "2026-05-27T10:30:00Z",
        createdBy: "Sana Waheed",
        updatedBy: "Dr. Mehak Ali"
      }
    ],
    appointments: [
      {
        id: "apt_lum_1",
        tenantId: "tenant_lumen",
        patientId: "pat_lum_1",
        status: "assigned",
        channel: "home_collection",
        scheduledAt: "2026-05-27T06:30:00Z",
        branchName: "Gulberg Flagship",
        createdAt: "2026-05-26T08:15:00Z",
        updatedAt: "2026-05-27T05:50:00Z",
        createdBy: "Sana Waheed",
        updatedBy: "Sana Waheed"
      },
      {
        id: "apt_lum_2",
        tenantId: "tenant_lumen",
        patientId: "pat_lum_2",
        status: "completed",
        channel: "walk_in",
        scheduledAt: "2026-05-27T08:00:00Z",
        branchName: "Clifton Processing Hub",
        createdAt: "2026-05-26T09:05:00Z",
        updatedAt: "2026-05-27T08:50:00Z",
        createdBy: "Sana Waheed",
        updatedBy: "Sana Waheed"
      },
      {
        id: "apt_lum_3",
        tenantId: "tenant_lumen",
        patientId: "pat_lum_3",
        status: "scheduled",
        channel: "walk_in",
        scheduledAt: "2026-05-28T05:30:00Z",
        branchName: "Blue Area Centre",
        createdAt: "2026-05-27T09:41:00Z",
        updatedAt: "2026-05-27T09:41:00Z",
        createdBy: "Ayesha Noor",
        updatedBy: "Ayesha Noor"
      },
      {
        id: "apt_lum_4",
        tenantId: "tenant_lumen",
        patientId: "pat_lum_4",
        status: "completed",
        channel: "walk_in",
        scheduledAt: "2026-05-25T07:20:00Z",
        branchName: "DHA Phase 5",
        createdAt: "2026-05-25T07:16:00Z",
        updatedAt: "2026-05-27T10:30:00Z",
        createdBy: "Sana Waheed",
        updatedBy: "Dr. Mehak Ali"
      }
    ],
    orders: [
      {
        id: "ord_lum_1",
        tenantId: "tenant_lumen",
        patientId: "pat_lum_1",
        appointmentId: "apt_lum_1",
        orderNumber: "LUM-2026-4012",
        tests: ["CBC", "Ferritin", "Vitamin D"],
        status: "in_progress",
        branchName: "Gulberg Flagship",
        homeCollection: true,
        createdAt: "2026-05-26T08:20:00Z",
        updatedAt: "2026-05-27T06:40:00Z",
        createdBy: "Sana Waheed",
        updatedBy: "Usman Tariq"
      },
      {
        id: "ord_lum_2",
        tenantId: "tenant_lumen",
        patientId: "pat_lum_2",
        appointmentId: "apt_lum_2",
        orderNumber: "LUM-2026-4013",
        tests: ["HbA1c", "Fasting Glucose"],
        status: "awaiting_release",
        branchName: "Clifton Processing Hub",
        homeCollection: false,
        createdAt: "2026-05-26T09:10:00Z",
        updatedAt: "2026-05-27T09:12:00Z",
        createdBy: "Sana Waheed",
        updatedBy: "Usman Tariq"
      },
      {
        id: "ord_lum_3",
        tenantId: "tenant_lumen",
        patientId: "pat_lum_3",
        appointmentId: "apt_lum_3",
        orderNumber: "LUM-2026-4014",
        tests: ["Lipid Profile"],
        status: "registered",
        branchName: "Blue Area Centre",
        homeCollection: false,
        createdAt: "2026-05-27T09:42:00Z",
        updatedAt: "2026-05-27T09:42:00Z",
        createdBy: "Ayesha Noor",
        updatedBy: "Ayesha Noor"
      },
      {
        id: "ord_lum_4",
        tenantId: "tenant_lumen",
        patientId: "pat_lum_4",
        appointmentId: "apt_lum_4",
        orderNumber: "LUM-2026-4015",
        tests: ["TSH", "Free T4"],
        status: "released",
        branchName: "DHA Phase 5",
        homeCollection: false,
        createdAt: "2026-05-25T07:21:00Z",
        updatedAt: "2026-05-27T10:30:00Z",
        createdBy: "Sana Waheed",
        updatedBy: "Dr. Mehak Ali"
      }
    ],
    samples: [
      {
        id: "sam_lum_1",
        tenantId: "tenant_lumen",
        orderId: "ord_lum_1",
        barcode: "LMBC2404012",
        specimen: "Serum",
        status: "processing",
        collectedAt: "2026-05-27T06:35:00Z",
        lastCheckpoint: "Analyzer prep bench",
        createdAt: "2026-05-26T08:20:00Z",
        updatedAt: "2026-05-27T07:45:00Z",
        createdBy: "Sana Waheed",
        updatedBy: "Usman Tariq"
      },
      {
        id: "sam_lum_2",
        tenantId: "tenant_lumen",
        orderId: "ord_lum_2",
        barcode: "LMBC2404013",
        specimen: "Whole blood",
        status: "verified",
        collectedAt: "2026-05-27T08:10:00Z",
        lastCheckpoint: "Pathologist validation queue",
        createdAt: "2026-05-26T09:10:00Z",
        updatedAt: "2026-05-27T09:05:00Z",
        createdBy: "Sana Waheed",
        updatedBy: "Dr. Mehak Ali"
      },
      {
        id: "sam_lum_3",
        tenantId: "tenant_lumen",
        orderId: "ord_lum_3",
        barcode: "LMBC2404014",
        specimen: "Serum",
        status: "registered",
        lastCheckpoint: "Awaiting collection desk",
        createdAt: "2026-05-27T09:42:00Z",
        updatedAt: "2026-05-27T09:42:00Z",
        createdBy: "Ayesha Noor",
        updatedBy: "Ayesha Noor"
      },
      {
        id: "sam_lum_4",
        tenantId: "tenant_lumen",
        orderId: "ord_lum_4",
        barcode: "LMBC2404015",
        specimen: "Serum",
        status: "released",
        collectedAt: "2026-05-25T07:35:00Z",
        lastCheckpoint: "Released to patient portal",
        createdAt: "2026-05-25T07:21:00Z",
        updatedAt: "2026-05-27T10:30:00Z",
        createdBy: "Bilal Ahmed",
        updatedBy: "Dr. Mehak Ali"
      }
    ],
    results: [
      {
        id: "res_lum_1",
        tenantId: "tenant_lumen",
        orderId: "ord_lum_1",
        sampleId: "sam_lum_1",
        testName: "Ferritin",
        status: "entered",
        value: "22 ng/mL",
        referenceRange: "13 - 150",
        abnormal: false,
        critical: false,
        createdAt: "2026-05-27T07:50:00Z",
        updatedAt: "2026-05-27T07:50:00Z",
        createdBy: "Usman Tariq",
        updatedBy: "Usman Tariq"
      },
      {
        id: "res_lum_2",
        tenantId: "tenant_lumen",
        orderId: "ord_lum_2",
        sampleId: "sam_lum_2",
        testName: "HbA1c",
        status: "validated",
        value: "9.1 %",
        referenceRange: "4.0 - 5.6",
        abnormal: true,
        critical: true,
        validatorName: "Dr. Mehak Ali",
        createdAt: "2026-05-27T08:55:00Z",
        updatedAt: "2026-05-27T09:05:00Z",
        createdBy: "Usman Tariq",
        updatedBy: "Dr. Mehak Ali"
      },
      {
        id: "res_lum_3",
        tenantId: "tenant_lumen",
        orderId: "ord_lum_4",
        sampleId: "sam_lum_4",
        testName: "TSH",
        status: "released",
        value: "2.4 mIU/L",
        referenceRange: "0.4 - 4.0",
        abnormal: false,
        critical: false,
        validatorName: "Dr. Mehak Ali",
        createdAt: "2026-05-27T10:10:00Z",
        updatedAt: "2026-05-27T10:30:00Z",
        createdBy: "Usman Tariq",
        updatedBy: "Dr. Mehak Ali"
      }
    ],
    invoices: [
      {
        id: "inv_lum_1",
        tenantId: "tenant_lumen",
        orderId: "ord_lum_1",
        invoiceNumber: "INV-LUM-9811",
        status: "paid",
        totalAmount: 8700,
        paidAmount: 8700,
        currency: "PKR",
        createdAt: "2026-05-26T08:21:00Z",
        updatedAt: "2026-05-26T08:22:00Z",
        createdBy: "Sana Waheed",
        updatedBy: "Sana Waheed"
      },
      {
        id: "inv_lum_2",
        tenantId: "tenant_lumen",
        orderId: "ord_lum_2",
        invoiceNumber: "INV-LUM-9812",
        status: "partially_paid",
        totalAmount: 4300,
        paidAmount: 2000,
        currency: "PKR",
        createdAt: "2026-05-26T09:12:00Z",
        updatedAt: "2026-05-27T08:12:00Z",
        createdBy: "Sana Waheed",
        updatedBy: "Sana Waheed"
      },
      {
        id: "inv_lum_3",
        tenantId: "tenant_lumen",
        orderId: "ord_lum_3",
        invoiceNumber: "INV-LUM-9813",
        status: "issued",
        totalAmount: 3500,
        paidAmount: 0,
        currency: "PKR",
        createdAt: "2026-05-27T09:43:00Z",
        updatedAt: "2026-05-27T09:43:00Z",
        createdBy: "Ayesha Noor",
        updatedBy: "Ayesha Noor"
      },
      {
        id: "inv_lum_4",
        tenantId: "tenant_lumen",
        orderId: "ord_lum_4",
        invoiceNumber: "INV-LUM-9814",
        status: "paid",
        totalAmount: 5200,
        paidAmount: 5200,
        currency: "PKR",
        createdAt: "2026-05-25T07:22:00Z",
        updatedAt: "2026-05-25T07:40:00Z",
        createdBy: "Sana Waheed",
        updatedBy: "Sana Waheed"
      }
    ],
    reports: [
      {
        id: "rep_lum_1",
        tenantId: "tenant_lumen",
        orderId: "ord_lum_2",
        reportNumber: "RPT-LUM-4401",
        status: "draft",
        createdAt: "2026-05-27T09:07:00Z",
        updatedAt: "2026-05-27T09:07:00Z",
        createdBy: "Dr. Mehak Ali",
        updatedBy: "Dr. Mehak Ali"
      },
      {
        id: "rep_lum_2",
        tenantId: "tenant_lumen",
        orderId: "ord_lum_4",
        reportNumber: "RPT-LUM-4402",
        status: "released",
        releasedAt: "2026-05-27T10:30:00Z",
        releasedBy: "Dr. Mehak Ali",
        createdAt: "2026-05-27T10:15:00Z",
        updatedAt: "2026-05-27T10:30:00Z",
        createdBy: "Dr. Mehak Ali",
        updatedBy: "Dr. Mehak Ali"
      }
    ],
    reportAmendments: [],
    criticalAlerts: [
      {
        id: "crit_lum_1",
        tenantId: "tenant_lumen",
        resultId: "res_lum_2",
        patientId: "pat_lum_2",
        status: "open",
        createdAt: "2026-05-27T09:05:00Z",
        updatedAt: "2026-05-27T09:05:00Z",
        createdBy: "Dr. Mehak Ali",
        updatedBy: "Dr. Mehak Ali"
      }
    ],
    auditLogs: []
  },
  tenant_cedar: {
    tenantId: "tenant_cedar",
    patients: [
      {
        id: "pat_ced_1",
        tenantId: "tenant_cedar",
        mrn: "CD-11841",
        fullName: "Sophia Reed",
        phone: "+44 7700 900100",
        nationalId: "UK-NHS-883821",
        dateOfBirth: "1991-04-09",
        sex: "female",
        consentedAt: "2026-05-26T07:30:00Z",
        createdAt: "2026-05-26T07:30:00Z",
        updatedAt: "2026-05-26T07:30:00Z",
        createdBy: "Clare Mason",
        updatedBy: "Clare Mason"
      },
      {
        id: "pat_ced_2",
        tenantId: "tenant_cedar",
        mrn: "CD-11842",
        fullName: "Oliver Grant",
        phone: "+44 7700 900150",
        nationalId: "UK-NHS-883999",
        dateOfBirth: "1985-12-02",
        sex: "male",
        consentedAt: "2026-05-25T09:10:00Z",
        createdAt: "2026-05-25T09:10:00Z",
        updatedAt: "2026-05-27T11:00:00Z",
        createdBy: "Ibrahim Nadeem",
        updatedBy: "Dr. Hannah Cole"
      }
    ],
    appointments: [
      {
        id: "apt_ced_1",
        tenantId: "tenant_cedar",
        patientId: "pat_ced_1",
        status: "confirmed",
        channel: "portal",
        scheduledAt: "2026-05-27T10:00:00Z",
        branchName: "London City",
        createdAt: "2026-05-26T07:31:00Z",
        updatedAt: "2026-05-26T07:31:00Z",
        createdBy: "Sophia Reed",
        updatedBy: "Sophia Reed"
      },
      {
        id: "apt_ced_2",
        tenantId: "tenant_cedar",
        patientId: "pat_ced_2",
        status: "completed",
        channel: "walk_in",
        scheduledAt: "2026-05-25T09:30:00Z",
        branchName: "Manchester Central",
        createdAt: "2026-05-25T09:11:00Z",
        updatedAt: "2026-05-27T11:00:00Z",
        createdBy: "Ibrahim Nadeem",
        updatedBy: "Ibrahim Nadeem"
      }
    ],
    orders: [
      {
        id: "ord_ced_1",
        tenantId: "tenant_cedar",
        patientId: "pat_ced_1",
        appointmentId: "apt_ced_1",
        orderNumber: "CED-2026-8007",
        tests: ["Lipid Profile", "LFT"],
        status: "registered",
        branchName: "London City",
        homeCollection: false,
        createdAt: "2026-05-26T07:32:00Z",
        updatedAt: "2026-05-26T07:32:00Z",
        createdBy: "Sophia Reed",
        updatedBy: "Sophia Reed"
      },
      {
        id: "ord_ced_2",
        tenantId: "tenant_cedar",
        patientId: "pat_ced_2",
        appointmentId: "apt_ced_2",
        orderNumber: "CED-2026-8008",
        tests: ["Thyroid Profile"],
        status: "awaiting_release",
        branchName: "Manchester Central",
        homeCollection: false,
        createdAt: "2026-05-25T09:12:00Z",
        updatedAt: "2026-05-27T11:00:00Z",
        createdBy: "Ibrahim Nadeem",
        updatedBy: "Ibrahim Nadeem"
      }
    ],
    samples: [
      {
        id: "sam_ced_1",
        tenantId: "tenant_cedar",
        orderId: "ord_ced_1",
        barcode: "CDBC8007",
        specimen: "Serum",
        status: "registered",
        lastCheckpoint: "Awaiting collection desk",
        createdAt: "2026-05-26T07:32:00Z",
        updatedAt: "2026-05-26T07:32:00Z",
        createdBy: "Sophia Reed",
        updatedBy: "Sophia Reed"
      },
      {
        id: "sam_ced_2",
        tenantId: "tenant_cedar",
        orderId: "ord_ced_2",
        barcode: "CDBC8008",
        specimen: "Serum",
        status: "verified",
        collectedAt: "2026-05-25T09:35:00Z",
        lastCheckpoint: "Pathologist validation queue",
        createdAt: "2026-05-25T09:12:00Z",
        updatedAt: "2026-05-27T11:00:00Z",
        createdBy: "Maya Ellis",
        updatedBy: "Dr. Hannah Cole"
      }
    ],
    results: [
      {
        id: "res_ced_1",
        tenantId: "tenant_cedar",
        orderId: "ord_ced_2",
        sampleId: "sam_ced_2",
        testName: "TSH",
        status: "validated",
        value: "3.1 mIU/L",
        referenceRange: "0.4 - 4.0",
        abnormal: false,
        critical: false,
        validatorName: "Dr. Hannah Cole",
        createdAt: "2026-05-27T10:50:00Z",
        updatedAt: "2026-05-27T11:00:00Z",
        createdBy: "Ibrahim Nadeem",
        updatedBy: "Dr. Hannah Cole"
      }
    ],
    invoices: [
      {
        id: "inv_ced_1",
        tenantId: "tenant_cedar",
        orderId: "ord_ced_1",
        invoiceNumber: "INV-CED-5101",
        status: "issued",
        totalAmount: 180,
        paidAmount: 0,
        currency: "GBP",
        createdAt: "2026-05-26T07:33:00Z",
        updatedAt: "2026-05-26T07:33:00Z",
        createdBy: "Clare Mason",
        updatedBy: "Clare Mason"
      },
      {
        id: "inv_ced_2",
        tenantId: "tenant_cedar",
        orderId: "ord_ced_2",
        invoiceNumber: "INV-CED-5102",
        status: "paid",
        totalAmount: 140,
        paidAmount: 140,
        currency: "GBP",
        createdAt: "2026-05-25T09:13:00Z",
        updatedAt: "2026-05-25T09:30:00Z",
        createdBy: "Clare Mason",
        updatedBy: "Clare Mason"
      }
    ],
    reports: [
      {
        id: "rep_ced_1",
        tenantId: "tenant_cedar",
        orderId: "ord_ced_2",
        reportNumber: "RPT-CED-7701",
        status: "draft",
        createdAt: "2026-05-27T11:00:00Z",
        updatedAt: "2026-05-27T11:00:00Z",
        createdBy: "Dr. Hannah Cole",
        updatedBy: "Dr. Hannah Cole"
      }
    ],
    reportAmendments: [],
    criticalAlerts: [],
    auditLogs: []
  }
};

export function getTenantSnapshot(tenantId: string): TenantSnapshot {
  return tenantSnapshots[tenantId] ?? tenantSnapshots.tenant_lumen;
}

export function getSessionActor(tenantId: string, role: SessionActor["role"]): SessionActor {
  return sessionActors[tenantId]?.find((actor) => actor.role === role) ?? sessionActors.tenant_lumen[0];
}
