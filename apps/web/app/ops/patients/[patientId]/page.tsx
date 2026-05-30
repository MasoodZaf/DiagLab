import { notFound } from "next/navigation";
import { Card, SectionHeading } from "@lab/ui";
import { OpsShell } from "../../../../components/ops-shell";
import { getTenantDomainData } from "../../../../lib/domain";
import { formatDateTime, formatMoney } from "../../../../lib/format";
import { getAppContext } from "../../../../lib/session";

type PageProps = {
  params: Promise<{ patientId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OpsPatientDetailPage({ params, searchParams }: PageProps) {
  const [{ patientId }, resolvedParams] = await Promise.all([params, searchParams ?? Promise.resolve(undefined)]);
  const { tenant, locale } = getAppContext(resolvedParams, { defaultRole: "receptionist" });
  const { snapshot, receptionistActor } = getTenantDomainData(tenant);
  const patient = snapshot.patients.find((entry) => entry.id === patientId);

  if (!patient) {
    notFound();
  }

  const orders = snapshot.orders.filter((entry) => entry.patientId === patient.id);
  const appointments = snapshot.appointments.filter((entry) => entry.patientId === patient.id);

  return (
    <OpsShell active="patients" actor={receptionistActor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <SectionHeading eyebrow="Patient detail">{patient.fullName}</SectionHeading>
          <dl className="mt-6 grid gap-4 text-sm">
            <div className="rounded-[22px] bg-[var(--color-panel-muted)] p-4">
              <dt className="text-[var(--color-text-muted)]">MRN</dt>
              <dd className="mt-1 font-medium">{patient.mrn}</dd>
            </div>
            <div className="rounded-[22px] bg-[var(--color-panel-muted)] p-4">
              <dt className="text-[var(--color-text-muted)]">Phone</dt>
              <dd className="mt-1 font-medium">{patient.phone}</dd>
            </div>
            <div className="rounded-[22px] bg-[var(--color-panel-muted)] p-4">
              <dt className="text-[var(--color-text-muted)]">Consent captured</dt>
              <dd className="mt-1 font-medium">{formatDateTime(patient.consentedAt)}</dd>
            </div>
          </dl>
        </Card>
        <Card className="p-6">
          <SectionHeading eyebrow="Linked activity">Orders, appointments, and balance</SectionHeading>
          <div className="mt-6 grid gap-4">
            {orders.map((order) => {
              const invoice = snapshot.invoices.find((entry) => entry.orderId === order.id);
              const appointment = appointments.find((entry) => entry.id === order.appointmentId);

              return (
                <div className="rounded-[24px] bg-[var(--color-panel-muted)] p-5" key={order.id}>
                  <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">{order.orderNumber}</p>
                  <p className="mt-2 font-medium text-[var(--color-text)]">{order.tests.join(" · ")}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
                    <span>{appointment ? formatDateTime(appointment.scheduledAt) : "No appointment"}</span>
                    {invoice ? <span>{formatMoney(invoice.totalAmount - invoice.paidAmount, invoice.currency)} outstanding</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </OpsShell>
  );
}
