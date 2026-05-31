import Link from "next/link";
import { Card, SectionHeading } from "@lab/ui";
import { OpsShell } from "../../../components/ops-shell";
import { getTenantDomainData } from "../../../lib/domain";
import { getAppContext } from "../../../lib/session";
import { withParams } from "../../../lib/url";
import { formatDateTime, formatMoney } from "../../../lib/format";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OpsPatientsPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const { tenant, locale, intlLocale, t } = getAppContext(sp, { defaultRole: "receptionist" });
  const { snapshot, receptionistActor } = await getTenantDomainData(tenant);

  return (
    <OpsShell active="patients" actor={receptionistActor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <div className="grid gap-4">
        <Card className="p-6">
          <SectionHeading eyebrow={t("nav.patients")}>{t("ops.patients.subtitle")}</SectionHeading>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-start text-sm">
              <thead className="text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-4 py-2 text-start font-medium">{t("ops.patients.name")}</th>
                  <th className="px-4 py-2 text-start font-medium">{t("ops.patients.mrn")}</th>
                  <th className="px-4 py-2 text-start font-medium">{t("ops.patients.phone")}</th>
                  <th className="px-4 py-2 text-start font-medium">{t("patient.upcoming")}</th>
                  <th className="px-4 py-2 text-start font-medium">{t("ops.patients.balance")}</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.patients.map((patient) => {
                  const appointment = snapshot.appointments.find((entry) => entry.patientId === patient.id);
                  const order = snapshot.orders.find((entry) => entry.patientId === patient.id);
                  const invoice = snapshot.invoices.find((entry) => entry.orderId === order?.id);
                  const outstanding = invoice ? invoice.totalAmount - invoice.paidAmount : 0;

                  return (
                    <tr className="bg-[var(--color-panel-muted)]" key={patient.id}>
                      <td className="rounded-s-[14px] px-4 py-3 font-medium">
                        <Link
                          className="hover:text-[var(--color-primary)]"
                          href={withParams(`/ops/patients/${patient.id}`, { tenant: tenant.slug, lang: locale })}
                        >
                          {patient.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{patient.mrn}</td>
                      <td className="px-4 py-3 tabular-nums">{patient.phone}</td>
                      <td className="px-4 py-3">
                        {formatDateTime(appointment?.scheduledAt, intlLocale, tenant.timezone) ?? t("common.pending")}
                      </td>
                      <td className="rounded-e-[14px] px-4 py-3 tabular-nums">
                        {formatMoney(outstanding, invoice?.currency ?? "PKR", intlLocale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </OpsShell>
  );
}
