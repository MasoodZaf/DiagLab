import { ShieldAlert } from "lucide-react";
import { Card } from "@lab/ui";
import { outletTypes, type OutletType, type UserRole } from "@lab/contracts";
import { getTenantOrg, testCatalog } from "@lab/demo-data";
import { OpsShell } from "../../../components/ops-shell";
import { LabAdmin, type LabAdminLabels } from "../../../components/admin/lab-admin";
import { getAppContext } from "../../../lib/session";
import { getTenantDomainData } from "../../../lib/domain";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const STAFF_ASSIGNABLE: UserRole[] = [
  "receptionist",
  "phlebotomist",
  "rider",
  "technician",
  "pathologist",
  "branch_manager",
  "lab_admin"
];

const TYPE_KEY: Record<OutletType, string> = {
  central_lab: "labAdmin.typeCentralLab",
  processing_hub: "labAdmin.typeProcessingHub",
  collection_center: "labAdmin.typeCollectionCenter"
};

export default async function LabAdminPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const { tenant, actor, locale, intlLocale, t } = getAppContext(sp, { defaultRole: "lab_admin" });
  const { snapshot } = getTenantDomainData(tenant);

  // RBAC: tenant administration is for the Lab Admin (platform Super Admin may also enter).
  if (actor.role !== "lab_admin" && actor.role !== "super_admin") {
    return (
      <OpsShell active="labadmin" actor={actor} snapshot={snapshot} tenant={tenant} locale={locale}>
        <Card className="mx-auto max-w-xl p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-danger)_14%,transparent)] text-[var(--color-danger)]">
            <ShieldAlert className="size-6" />
          </div>
          <h2 className="mt-5 font-[var(--font-display)] text-2xl text-[var(--color-text)]">{t("labAdmin.restrictedTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{t("labAdmin.restrictedBody")}</p>
        </Card>
      </OpsShell>
    );
  }

  const org = getTenantOrg(tenant.id);
  const currency = tenant.locale === "en-GB" ? "GBP" : "PKR";

  const tests = testCatalog.tests.map((test) => ({
    code: test.code,
    name: test.name,
    department: t(`catalog.departments.${test.department}`),
    fee: test.prices[currency] ?? test.prices.USD ?? 0
  }));

  const roleOptions = STAFF_ASSIGNABLE.map((role) => ({ value: role, label: t(`roles.${role}`) }));
  const outletTypeOptions = outletTypes.map((value) => ({ value, label: t(TYPE_KEY[value]) }));

  const labels: LabAdminLabels = {
    title: t("labAdmin.title"),
    subtitle: t("labAdmin.subtitle"),
    tabOutlets: t("labAdmin.tabOutlets"),
    tabPanel: t("labAdmin.tabPanel"),
    tabTeam: t("labAdmin.tabTeam"),
    tabTests: t("labAdmin.tabTests"),
    outletsTitle: t("labAdmin.outletsTitle"),
    outletsSubtitle: t("labAdmin.outletsSubtitle"),
    addOutlet: t("labAdmin.addOutlet"),
    outletName: t("labAdmin.outletName"),
    city: t("labAdmin.city"),
    type: t("labAdmin.type"),
    address: t("labAdmin.address"),
    phone: t("labAdmin.phone"),
    panelTitle: t("labAdmin.panelTitle"),
    panelSubtitle: t("labAdmin.panelSubtitle"),
    addDoctor: t("labAdmin.addDoctor"),
    fullName: t("labAdmin.fullName"),
    specialty: t("labAdmin.specialty"),
    qualification: t("labAdmin.qualification"),
    assignedOutlets: t("labAdmin.assignedOutlets"),
    teamTitle: t("labAdmin.teamTitle"),
    teamSubtitle: t("labAdmin.teamSubtitle"),
    addStaff: t("labAdmin.addStaff"),
    role: t("labAdmin.role"),
    outlet: t("labAdmin.outlet"),
    status: t("labAdmin.status"),
    testsTitle: t("labAdmin.testsTitle"),
    testsSubtitle: t("labAdmin.testsSubtitle"),
    addTest: t("labAdmin.addTest"),
    code: t("labAdmin.code"),
    test: t("labAdmin.test"),
    department: t("labAdmin.department"),
    fee: t("labAdmin.fee"),
    offered: t("labAdmin.offered"),
    add: t("labAdmin.add"),
    cancel: t("labAdmin.cancel"),
    statusActive: t("labAdmin.statusActive"),
    statusInactive: t("labAdmin.statusInactive"),
    statusOnLeave: t("labAdmin.statusOnLeave"),
    countOutlets: t("labAdmin.countOutlets"),
    countDoctors: t("labAdmin.countDoctors"),
    countStaff: t("labAdmin.countStaff"),
    countTests: t("labAdmin.countTests"),
    email: t("labAdmin.email"),
    loginAccess: t("labAdmin.loginAccess"),
    enableLogin: t("labAdmin.enableLogin"),
    loginActive: t("labAdmin.loginActive"),
    loginNone: t("labAdmin.loginNone"),
    availability: t("labAdmin.availability"),
    availabilityHint: t("labAdmin.availabilityHint"),
    remove: t("labAdmin.remove"),
    tabSchedule: t("labAdmin.tabSchedule"),
    tabInventory: t("labAdmin.tabInventory"),
    scheduleTitle: t("labAdmin.scheduleTitle"),
    scheduleSubtitle: t("labAdmin.scheduleSubtitle"),
    inventoryTitle: t("labAdmin.inventoryTitle"),
    inventorySubtitle: t("labAdmin.inventorySubtitle"),
    addReagent: t("labAdmin.addReagent"),
    reagentName: t("labAdmin.reagentName"),
    stock: t("labAdmin.stock"),
    unit: t("labAdmin.unit"),
    reorderLevel: t("labAdmin.reorderLevel"),
    stockOk: t("labAdmin.stockOk"),
    stockLow: t("labAdmin.stockLow"),
    stockOut: t("labAdmin.stockOut"),
    countReagents: t("labAdmin.countReagents"),
    countSchedule: t("labAdmin.countSchedule"),
    sessionOff: t("labAdmin.sessionOff"),
    sessionMorning: t("labAdmin.sessionMorning"),
    sessionEvening: t("labAdmin.sessionEvening"),
    sessionFull: t("labAdmin.sessionFull"),
    dayMon: t("labAdmin.dayMon"),
    dayTue: t("labAdmin.dayTue"),
    dayWed: t("labAdmin.dayWed"),
    dayThu: t("labAdmin.dayThu"),
    dayFri: t("labAdmin.dayFri"),
    daySat: t("labAdmin.daySat"),
    daySun: t("labAdmin.daySun")
  };

  return (
    <OpsShell active="labadmin" actor={actor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <LabAdmin
        outlets={org.outlets}
        doctors={org.doctors}
        staff={org.staff}
        tests={tests}
        schedule={org.schedule}
        inventory={org.inventory}
        currency={currency}
        intlLocale={intlLocale}
        roleOptions={roleOptions}
        outletTypeOptions={outletTypeOptions}
        labels={labels}
      />
    </OpsShell>
  );
}
