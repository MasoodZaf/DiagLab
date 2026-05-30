import type { TenantOrg } from "@lab/contracts";

// Per-tenant organisation config: nationwide outlets, the consultant panel,
// and the on-ground team (employees + riders). Managed in the Lab Admin area.
export const tenantOrgs: Record<string, TenantOrg> = {
  tenant_lumen: {
    outlets: [
      { id: "out_lum_1", tenantId: "tenant_lumen", name: "Gulberg Flagship", city: "Lahore", type: "central_lab", address: "Main Boulevard, Gulberg III", phone: "+92 42 111 555 100", active: true },
      { id: "out_lum_2", tenantId: "tenant_lumen", name: "Clifton Processing Hub", city: "Karachi", type: "processing_hub", address: "Block 5, Clifton", phone: "+92 21 111 555 200", active: true },
      { id: "out_lum_3", tenantId: "tenant_lumen", name: "Blue Area Centre", city: "Islamabad", type: "collection_center", address: "Jinnah Avenue, Blue Area", phone: "+92 51 111 555 300", active: true },
      { id: "out_lum_4", tenantId: "tenant_lumen", name: "DHA Phase 5", city: "Lahore", type: "collection_center", address: "Phase 5, DHA", phone: "+92 42 111 555 400", active: true }
    ],
    doctors: [
      { id: "doc_lum_1", tenantId: "tenant_lumen", name: "Dr. Mehak Ali", specialty: "Histopathology", qualification: "MBBS, FCPS (Histopathology)", outletIds: ["out_lum_1", "out_lum_2"], status: "active" },
      { id: "doc_lum_2", tenantId: "tenant_lumen", name: "Dr. Imran Qureshi", specialty: "Clinical Pathology", qualification: "MBBS, MPhil", outletIds: ["out_lum_1"], status: "active" },
      { id: "doc_lum_3", tenantId: "tenant_lumen", name: "Dr. Sadia Khan", specialty: "Endocrinology", qualification: "MBBS, FCPS (Medicine)", outletIds: ["out_lum_3"], status: "active" },
      { id: "doc_lum_4", tenantId: "tenant_lumen", name: "Dr. Asad Mahmood", specialty: "Microbiology", qualification: "MBBS, PhD (Microbiology)", outletIds: ["out_lum_2"], status: "active" }
    ],
    staff: [
      { id: "stf_lum_1", tenantId: "tenant_lumen", name: "Sana Waheed", role: "receptionist", outletId: "out_lum_1", phone: "+92 300 555 0101", status: "active", email: "sana.waheed@lumen.health", loginEnabled: true },
      { id: "stf_lum_2", tenantId: "tenant_lumen", name: "Bilal Ahmed", role: "phlebotomist", outletId: "out_lum_1", phone: "+92 300 555 0202", status: "active", email: "bilal.ahmed@lumen.health", loginEnabled: true },
      { id: "stf_lum_3", tenantId: "tenant_lumen", name: "Usman Tariq", role: "technician", outletId: "out_lum_1", phone: "+92 300 555 0303", status: "active", email: "usman.tariq@lumen.health", loginEnabled: true },
      { id: "stf_lum_4", tenantId: "tenant_lumen", name: "Imran Shah", role: "rider", outletId: "out_lum_1", phone: "+92 300 555 0404", status: "active", loginEnabled: false },
      { id: "stf_lum_5", tenantId: "tenant_lumen", name: "Ayesha Noor", role: "receptionist", outletId: "out_lum_3", phone: "+92 300 555 0505", status: "active", email: "ayesha.noor@lumen.health", loginEnabled: true },
      { id: "stf_lum_6", tenantId: "tenant_lumen", name: "Kamran Riaz", role: "rider", outletId: "out_lum_3", phone: "+92 300 555 0606", status: "on_leave", loginEnabled: false }
    ],
    schedule: [
      { doctorId: "doc_lum_1", day: "mon", session: "morning" },
      { doctorId: "doc_lum_1", day: "wed", session: "morning" },
      { doctorId: "doc_lum_1", day: "fri", session: "full_day" },
      { doctorId: "doc_lum_2", day: "tue", session: "evening" },
      { doctorId: "doc_lum_2", day: "thu", session: "evening" },
      { doctorId: "doc_lum_3", day: "mon", session: "full_day" },
      { doctorId: "doc_lum_3", day: "sat", session: "morning" },
      { doctorId: "doc_lum_4", day: "wed", session: "evening" }
    ],
    inventory: [
      { id: "rgt_lum_1", tenantId: "tenant_lumen", outletId: "out_lum_1", name: "CBC diluent", unit: "L", stock: 18, reorderLevel: 6 },
      { id: "rgt_lum_2", tenantId: "tenant_lumen", outletId: "out_lum_1", name: "HbA1c cartridge", unit: "box", stock: 4, reorderLevel: 5 },
      { id: "rgt_lum_3", tenantId: "tenant_lumen", outletId: "out_lum_2", name: "Ferritin assay kit", unit: "kit", stock: 0, reorderLevel: 2 },
      { id: "rgt_lum_4", tenantId: "tenant_lumen", outletId: "out_lum_2", name: "EDTA tubes", unit: "pack", stock: 42, reorderLevel: 15 },
      { id: "rgt_lum_5", tenantId: "tenant_lumen", outletId: "out_lum_3", name: "Vitamin D reagent", unit: "kit", stock: 3, reorderLevel: 3 }
    ]
  },
  tenant_cedar: {
    outlets: [
      { id: "out_ced_1", tenantId: "tenant_cedar", name: "London City", city: "London", type: "central_lab", address: "1 Finsbury Avenue", phone: "+44 20 7100 5000", active: true },
      { id: "out_ced_2", tenantId: "tenant_cedar", name: "Manchester Central", city: "Manchester", type: "collection_center", address: "Spinningfields", phone: "+44 161 100 5000", active: true }
    ],
    doctors: [
      { id: "doc_ced_1", tenantId: "tenant_cedar", name: "Dr. Hannah Cole", specialty: "Histopathology", qualification: "MBBS, FRCPath", outletIds: ["out_ced_1"], status: "active" },
      { id: "doc_ced_2", tenantId: "tenant_cedar", name: "Dr. James Patel", specialty: "Haematology", qualification: "MBBS, MRCP", outletIds: ["out_ced_2"], status: "active" }
    ],
    staff: [
      { id: "stf_ced_1", tenantId: "tenant_cedar", name: "Clare Mason", role: "receptionist", outletId: "out_ced_1", phone: "+44 7700 900200", status: "active", email: "clare.mason@cedar.health", loginEnabled: true },
      { id: "stf_ced_2", tenantId: "tenant_cedar", name: "Maya Ellis", role: "phlebotomist", outletId: "out_ced_1", phone: "+44 7700 900300", status: "active", email: "maya.ellis@cedar.health", loginEnabled: true },
      { id: "stf_ced_3", tenantId: "tenant_cedar", name: "Ibrahim Nadeem", role: "technician", outletId: "out_ced_1", phone: "+44 7700 900400", status: "active", email: "ibrahim.nadeem@cedar.health", loginEnabled: true }
    ],
    schedule: [
      { doctorId: "doc_ced_1", day: "mon", session: "full_day" },
      { doctorId: "doc_ced_1", day: "thu", session: "morning" },
      { doctorId: "doc_ced_2", day: "tue", session: "evening" },
      { doctorId: "doc_ced_2", day: "fri", session: "morning" }
    ],
    inventory: [
      { id: "rgt_ced_1", tenantId: "tenant_cedar", outletId: "out_ced_1", name: "Lipid panel reagent", unit: "kit", stock: 9, reorderLevel: 4 },
      { id: "rgt_ced_2", tenantId: "tenant_cedar", outletId: "out_ced_1", name: "LFT cartridge", unit: "box", stock: 2, reorderLevel: 3 },
      { id: "rgt_ced_2b", tenantId: "tenant_cedar", outletId: "out_ced_2", name: "Serum separator tubes", unit: "pack", stock: 0, reorderLevel: 10 }
    ]
  }
};

export function getTenantOrg(tenantId: string): TenantOrg {
  return tenantOrgs[tenantId] ?? { outlets: [], doctors: [], staff: [], schedule: [], inventory: [] };
}
