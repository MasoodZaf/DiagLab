import { DoorOpen } from "lucide-react";
import { getTenantOrg } from "@lab/demo-data";
import { Card } from "@lab/ui";
import type { TenantSnapshot } from "@lab/contracts";
import { OutletOps, type OutletJourney } from "../../components/outlet/outlet-ops";
import { TenantTheme } from "../../components/tenant-theme";
import { getAppContext } from "../../lib/session";
import { pickParam } from "../../lib/url";
import { store } from "../../lib/server/store";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const OUTLET_ROLES = ["receptionist", "phlebotomist", "technician", "branch_manager", "lab_admin", "super_admin"];

const COLLECTED_STATES = new Set(["collected", "in_transit", "received", "processing", "completed", "verified", "released"]);
const PROCESSED_STATES = new Set(["completed", "verified", "released"]);

function buildJourneys(snapshot: TenantSnapshot): OutletJourney[] {
  return snapshot.orders.map((order) => {
    const patient = snapshot.patients.find((p) => p.id === order.patientId);
    const samples = snapshot.samples.filter((s) => s.orderId === order.id);
    const results = snapshot.results.filter((r) => r.orderId === order.id);
    const invoice = snapshot.invoices.find((i) => i.orderId === order.id);
    const report = snapshot.reports.find((r) => r.orderId === order.id);
    const collected = samples.some((s) => COLLECTED_STATES.has(s.status));
    const processed =
      samples.some((s) => PROCESSED_STATES.has(s.status)) || results.some((r) => r.status === "validated" || r.status === "released");
    const reported = report?.status === "released";
    const paid = invoice?.status === "paid";
    const recallSuggested =
      results.some((r) => r.critical || r.abnormal) ||
      snapshot.criticalAlerts.some((a) => a.patientId === order.patientId && a.status === "open");

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      patientName: patient?.fullName ?? "—",
      mrn: patient?.mrn ?? "—",
      tests: order.tests,
      branchName: order.branchName,
      homeCollection: order.homeCollection,
      done: { booked: true, collected, processed, reported, paid },
      recallSuggested
    };
  });
}

export default async function OutletPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const { tenant, actor, locale, dir, t, intlLocale } = getAppContext(sp, { defaultRole: "receptionist" });

  if (!OUTLET_ROLES.includes(actor.role)) {
    return (
      <div lang={locale} dir={dir} className="flex min-h-dvh items-center justify-center bg-[var(--color-canvas)] p-6 text-[var(--color-text)]">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-danger)_14%,transparent)] text-[var(--color-danger)]">
            <DoorOpen className="size-6" />
          </div>
          <h2 className="mt-5 font-[var(--font-display)] text-2xl text-[var(--color-text)]">{t("outlet.restrictedTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{t("outlet.restrictedBody")}</p>
        </Card>
      </div>
    );
  }

  const org = getTenantOrg(tenant.id);
  const outlets = org.outlets.map((o) => ({ id: o.id, name: o.name, city: o.city }));
  const selectedOutletId = pickParam(sp, "outlet") ?? outlets[0]?.id ?? "";
  const snapshot = await store.getSnapshot(tenant.slug);
  const journeys = buildJourneys(snapshot);

  return (
    <TenantTheme tenant={tenant} locale={locale}>
      <OutletOps
        journeys={journeys}
        outlets={outlets}
        selectedOutletId={selectedOutletId}
        brandName={tenant.brandName}
        operatorName={actor.displayName}
        role={actor.role}
        locale={locale}
        intlLocale={intlLocale}
      />
    </TenantTheme>
  );
}
