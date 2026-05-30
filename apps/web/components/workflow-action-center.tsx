"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Activity, AlertTriangle, BadgeCheck, CheckCircle2, CreditCard, FileCheck2, FilePenLine, FlaskConical, ShieldCheck, UserPlus } from "lucide-react";
import type {
  SampleRecord,
  SessionActor,
  TenantConfig,
  TenantSnapshot,
  UserRole
} from "@lab/contracts";
import { sampleWorkflowRules } from "@lab/contracts";
import { Button, Card, SectionHeading, cn } from "@lab/ui";
import { getTranslator, localeMeta, type Locale } from "../lib/i18n";
import { formatDateTime, formatMoney } from "../lib/format";

type WorkflowActionCenterProps = {
  tenant: TenantConfig;
  locale: Locale;
  actors: {
    receptionist: SessionActor;
    phlebotomist: SessionActor;
    technician: SessionActor;
    pathologist: SessionActor;
  };
  initialSnapshot: TenantSnapshot;
};

type RegistrationForm = {
  fullName: string;
  phone: string;
  nationalId: string;
  tests: string;
  totalAmount: string;
  homeCollection: boolean;
};

const defaultRegistration: RegistrationForm = {
  fullName: "Sara Noor",
  phone: "+92 300 555 8765",
  nationalId: "35202-9999999-1",
  tests: "CBC, TSH",
  totalAmount: "5400",
  homeCollection: true
};

function cloneSnapshot(snapshot: TenantSnapshot): TenantSnapshot {
  return structuredClone(snapshot);
}

export function WorkflowActionCenter({ tenant, locale, actors, initialSnapshot }: WorkflowActionCenterProps) {
  const t = getTranslator(locale);
  const intlLocale = localeMeta[locale].intlLocale;
  const registrationActor = actors.receptionist;
  const clinicalActor = actors.pathologist;
  const [snapshot, setSnapshot] = useState<TenantSnapshot>(() => cloneSnapshot(initialSnapshot));
  const [form, setForm] = useState<RegistrationForm>(defaultRegistration);
  const [selectedSampleId, setSelectedSampleId] = useState(
    initialSnapshot.samples.find((sample) => sample.status === "processing" || sample.status === "verified")?.id ?? initialSnapshot.samples[0]?.id ?? ""
  );
  const [selectedResultId, setSelectedResultId] = useState(initialSnapshot.results.find((result) => result.status !== "validated")?.id ?? "");
  const [selectedAlertId, setSelectedAlertId] = useState(initialSnapshot.criticalAlerts[0]?.id ?? "");
  const [selectedReportId, setSelectedReportId] = useState(initialSnapshot.reports[0]?.id ?? "");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(initialSnapshot.invoices.find((invoice) => invoice.status !== "paid")?.id ?? initialSnapshot.invoices[0]?.id ?? "");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [amendmentNote, setAmendmentNote] = useState("Corrected interpretive note after clinician review.");
  const [message, setMessage] = useState(() => t("actions.ready"));
  const [messageKind, setMessageKind] = useState<"info" | "success" | "error">("info");
  const [isMutating, setIsMutating] = useState(false);

  const selectedSample = snapshot.samples.find((sample) => sample.id === selectedSampleId);
  const selectedReport = snapshot.reports.find((report) => report.id === selectedReportId);
  const selectedInvoice = snapshot.invoices.find((invoice) => invoice.id === selectedInvoiceId);
  const selectedReportAmendments = selectedReport ? snapshot.reportAmendments.filter((entry) => entry.reportId === selectedReport.id) : [];
  const openAlerts = snapshot.criticalAlerts.filter((alert) => alert.status === "open").length;
  const unpaidInvoices = snapshot.invoices.filter((invoice) => invoice.status !== "paid").length;
  const pendingReports = snapshot.reports.filter((report) => report.status === "draft").length;
  const activeSamples = snapshot.samples.filter((sample) => !["released", "rejected", "cancelled"].includes(sample.status)).length;
  function actorByRole(role: UserRole) {
    if (role === "receptionist") {
      return actors.receptionist;
    }
    if (role === "phlebotomist") {
      return actors.phlebotomist;
    }
    if (role === "technician") {
      return actors.technician;
    }
    if (role === "pathologist") {
      return actors.pathologist;
    }
    return undefined;
  }

  const releaseState = useMemo(() => {
    if (!selectedReport) {
      // Leave reasons empty so callers fall back to t("actions.selectReport").
      return { blocked: true, reasons: [] as string[] };
    }

    const orderResults = snapshot.results.filter((result) => result.orderId === selectedReport.orderId);
    const openAlerts = snapshot.criticalAlerts.filter((alert) =>
      alert.status === "open" && orderResults.some((result) => result.id === alert.resultId)
    );
    const invalidResults = orderResults.filter((result) => result.status !== "validated" && result.status !== "released");
    const reasons = [
      ...openAlerts.map(() => t("ops.dashboard.openAlerts")),
      ...invalidResults.map((result) => `${result.testName}`)
    ];

    return { blocked: reasons.length > 0, reasons };
  }, [selectedReport, snapshot.criticalAlerts, snapshot.results]);

  const allowedSampleTransitions = useMemo(() => {
    if (!selectedSample) {
      return [];
    }

    return sampleWorkflowRules
      .filter((rule) => rule.from === selectedSample.status)
      .map((rule) => ({
        ...rule,
        actor: rule.allowedRoles.map((role) => actorByRole(role)).find(Boolean)
      }))
      .filter((rule) => rule.actor);
  }, [selectedSample]);

  function updateForm<K extends keyof RegistrationForm>(key: K, value: RegistrationForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function showMessage(nextMessage: string, kind: "info" | "success" | "error" = "info") {
    setMessage(nextMessage);
    setMessageKind(kind);
  }

  // Server returns a locale-agnostic { code, params }; translate it here.
  function resolveStatus(message: unknown): string | undefined {
    if (!message) return undefined;
    if (typeof message === "string") return message;
    if (typeof message === "object" && "code" in (message as Record<string, unknown>)) {
      const m = message as { code: string; params?: Record<string, string | number> };
      const params: Record<string, string | number> = { ...(m.params ?? {}) };
      if (typeof params.status === "string") {
        params.status = t(`sampleStatus.${params.status}`);
      }
      return t(m.code, params);
    }
    return undefined;
  }

  async function runMutation(path: string, init: RequestInit, fallbackMessage: string) {
    setIsMutating(true);
    try {
      const response = await fetch(path, {
        ...init,
        headers: {
          "content-type": "application/json",
          ...init.headers
        }
      });
      const payload = await response.json().catch(() => ({}));
      const resolved = resolveStatus(payload.message) ?? fallbackMessage;

      if (!response.ok) {
        showMessage(resolved, "error");
        return undefined;
      }

      if (payload.snapshot) {
        setSnapshot(payload.snapshot);
      }
      showMessage(resolved, "success");
      return payload.snapshot as TenantSnapshot | undefined;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : fallbackMessage, "error");
      return undefined;
    } finally {
      setIsMutating(false);
    }
  }

  async function registerPatientAndOrder() {
    const tests = form.tests.split(",").map((test) => test.trim()).filter(Boolean);

    if (!form.fullName || tests.length === 0) {
      showMessage(t("actions.nameAndTestRequired"), "error");
      return;
    }

    const nextSnapshot = await runMutation(
      `/api/workflow/orders?tenant=${tenant.slug}`,
      {
        method: "POST",
        body: JSON.stringify({
          actor: registrationActor,
          fullName: form.fullName,
          phone: form.phone,
          nationalId: form.nationalId,
          tests,
          totalAmount: Number(form.totalAmount) || 0,
          homeCollection: form.homeCollection
        })
      },
      "Unable to register patient"
    );

    const latestSample = nextSnapshot?.samples.at(-1);
    if (latestSample) {
      setSelectedSampleId(latestSample.id);
    }
  }

  async function transitionSample(nextStatus: SampleRecord["status"], staffActor: SessionActor) {
    if (!selectedSample) {
      return;
    }

    await runMutation(
      `/api/workflow/samples/${selectedSample.id}?tenant=${tenant.slug}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          actor: staffActor,
          nextStatus
        })
      },
      "Unable to transition sample"
    );
  }

  async function validateResult() {
    const result = snapshot.results.find((entry) => entry.id === selectedResultId);
    if (!result) {
      showMessage(t("actions.selectResult"), "error");
      return;
    }

    await runMutation(
      `/api/workflow/results/${result.id}?tenant=${tenant.slug}`,
      {
        method: "PATCH",
        body: JSON.stringify({ actor: clinicalActor })
      },
      "Unable to validate result"
    );
  }

  async function acknowledgeAlert() {
    const alert = snapshot.criticalAlerts.find((entry) => entry.id === selectedAlertId);
    if (!alert) {
      showMessage(t("actions.selectAlert"), "error");
      return;
    }

    await runMutation(
      `/api/workflow/alerts/${alert.id}/acknowledge?tenant=${tenant.slug}`,
      {
        method: "POST",
        body: JSON.stringify({ actor: clinicalActor })
      },
      "Unable to acknowledge alert"
    );
  }

  async function recordPayment() {
    const invoice = snapshot.invoices.find((entry) => entry.id === selectedInvoiceId);
    if (!invoice) {
      showMessage(t("actions.selectInvoice"), "error");
      return;
    }

    const outstanding = invoice.totalAmount - invoice.paidAmount;
    const amount = paymentAmount ? Number(paymentAmount) : outstanding;
    await runMutation(
      `/api/workflow/invoices/${invoice.id}/payments?tenant=${tenant.slug}`,
      {
        method: "POST",
        body: JSON.stringify({
          actor: registrationActor,
          amount
        })
      },
      "Unable to record payment"
    );
    setPaymentAmount("");
  }

  async function releaseReport() {
    if (!selectedReport || releaseState.blocked) {
      showMessage(releaseState.reasons[0] ?? t("actions.selectReport"), "error");
      return;
    }

    await runMutation(
      `/api/workflow/reports/${selectedReport.id}/release?tenant=${tenant.slug}`,
      {
        method: "POST",
        body: JSON.stringify({ actor: clinicalActor })
      },
      "Unable to release report"
    );
  }

  async function amendReport() {
    if (!selectedReport) {
      showMessage(t("actions.selectReport"), "error");
      return;
    }
    if (!amendmentNote.trim()) {
      showMessage(t("actions.amendmentNote"), "error");
      return;
    }

    await runMutation(
      `/api/workflow/reports/${selectedReport.id}/amend?tenant=${tenant.slug}`,
      {
        method: "POST",
        body: JSON.stringify({
          actor: clinicalActor,
          note: amendmentNote
        })
      },
      "Unable to amend report"
    );
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-[var(--color-line)] bg-[var(--color-panel-muted)] px-6 py-5">
            <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">{t("actions.eyebrow")}</p>
            <h2 className="mt-2 text-balance font-[var(--font-display)] text-4xl text-[var(--color-text)]">
              {t("actions.title")}
            </h2>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
            <CommandMetric icon={<UserPlus className="size-4" />} label={t("actions.metricPatients")} value={snapshot.patients.length} />
            <CommandMetric icon={<FlaskConical className="size-4" />} label={t("actions.metricActiveSamples")} value={activeSamples} />
            <CommandMetric icon={<CreditCard className="size-4" />} label={t("actions.metricUnpaidInvoices")} value={unpaidInvoices} />
            <CommandMetric icon={<AlertTriangle className="size-4" />} label={t("actions.metricOpenAlerts")} value={openAlerts} tone={openAlerts ? "danger" : "default"} />
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow={t("actions.commandEyebrow")}>{t("actions.commandTitle")}</SectionHeading>
          <div
            className={cn(
              "mt-6 rounded-[18px] border p-4 text-sm leading-6",
              messageKind === "error" && "border-[var(--color-danger)] bg-[var(--color-panel-muted)] text-[var(--color-danger)]",
              messageKind === "success" && "border-[var(--color-success)] bg-[var(--color-panel-muted)] text-[var(--color-success)]",
              messageKind === "info" && "border-[var(--color-line)] bg-[var(--color-panel-muted)] text-[var(--color-text)]"
            )}
            role={messageKind === "error" ? "alert" : "status"}
          >
            {message}
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <StatusLine label={t("actions.pendingReports")} value={pendingReports} />
            <StatusLine label={t("actions.selectedInvoice")} value={selectedInvoice?.invoiceNumber ?? t("common.none")} />
            <StatusLine label={t("actions.selectedSample")} value={selectedSample?.barcode ?? t("common.none")} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card className="p-6">
          <SectionHeading eyebrow={t("actions.registrationEyebrow")}>{t("actions.registrationTitle")}</SectionHeading>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--color-text)]">{t("actions.patientName")}</span>
              <input
                className="min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-[var(--color-text)]"
                value={form.fullName}
                onChange={(event) => updateForm("fullName", event.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--color-text)]">{t("actions.phone")}</span>
                <input
                  className="min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-[var(--color-text)]"
                  value={form.phone}
                  onChange={(event) => updateForm("phone", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--color-text)]">{t("actions.cnic")}</span>
                <input
                  className="min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-[var(--color-text)]"
                  value={form.nationalId}
                  onChange={(event) => updateForm("nationalId", event.target.value)}
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--color-text)]">{t("actions.tests")}</span>
                <input
                  className="min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-[var(--color-text)]"
                  value={form.tests}
                  onChange={(event) => updateForm("tests", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--color-text)]">{t("actions.amount")}</span>
                <input
                  className="min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-[var(--color-text)]"
                  inputMode="numeric"
                  value={form.totalAmount}
                  onChange={(event) => updateForm("totalAmount", event.target.value)}
                />
              </label>
            </div>
            <label className="flex items-center gap-3 text-sm text-[var(--color-text)]">
              <input
                checked={form.homeCollection}
                className="size-4"
                type="checkbox"
                onChange={(event) => updateForm("homeCollection", event.target.checked)}
              />
              {t("actions.homeCollection")}
            </label>
            <Button className="gap-2" disabled={isMutating} onClick={registerPatientAndOrder}>
              <UserPlus className="size-4" />
              {t("actions.registerPatient")}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow={t("actions.workQueueEyebrow")}>{t("actions.workQueueTitle")}</SectionHeading>
          <div className="mt-6 grid gap-3 text-sm">
            <QueueRow
              icon={<CreditCard className="size-4" />}
              label={t("actions.paymentConfirmation")}
              value={`${unpaidInvoices} ${t("actions.unitInvoices")}`}
            />
            <QueueRow
              icon={<ShieldCheck className="size-4" />}
              label={t("actions.clinicalRelease")}
              value={`${pendingReports} ${t("actions.unitDraftReports")}`}
            />
            <QueueRow
              icon={<Activity className="size-4" />}
              label={t("actions.criticalEscalation")}
              value={`${openAlerts} ${t("actions.unitAlerts")}`}
              tone={openAlerts ? "danger" : "default"}
            />
            <QueueRow
              icon={<BadgeCheck className="size-4" />}
              label={t("actions.auditTrailLabel")}
              value={`${snapshot.auditLogs.length} ${t("actions.unitEvents")}`}
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <Card className="p-6">
          <SectionHeading eyebrow={t("actions.billingEyebrow")}>{t("actions.billingTitle")}</SectionHeading>
          <div className="mt-6 grid gap-4">
            <select
              aria-label={t("actions.selectInvoice")}
              className="min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-sm text-[var(--color-text)]"
              value={selectedInvoiceId}
              onChange={(event) => setSelectedInvoiceId(event.target.value)}
            >
              <option value="">{t("actions.selectInvoice")}</option>
              {snapshot.invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} - {t(`invoiceStatus.${invoice.status}`)}
                </option>
              ))}
            </select>
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--color-text)]">{t("actions.paymentAmount")}</span>
              <input
                className="min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-sm text-[var(--color-text)]"
                inputMode="decimal"
                placeholder={
                  selectedInvoice
                    ? t("actions.outstanding", { amount: formatMoney(selectedInvoice.totalAmount - selectedInvoice.paidAmount, selectedInvoice.currency, intlLocale) })
                    : t("actions.paymentAmount")
                }
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
              />
            </label>
            <Button className="gap-2" disabled={!selectedInvoice || selectedInvoice.status === "paid" || isMutating} tone="secondary" onClick={recordPayment}>
              <CreditCard className="size-4" />
              {t("actions.recordPayment")}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow={t("actions.samplesEyebrow")}>{t("actions.samplesTitle")}</SectionHeading>
          <div className="mt-6 grid gap-4">
            <select
              aria-label={t("actions.samplesTitle")}
              className="min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-sm text-[var(--color-text)]"
              value={selectedSampleId}
              onChange={(event) => setSelectedSampleId(event.target.value)}
            >
              {snapshot.samples.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.barcode} - {t(`sampleStatus.${sample.status}`)}
                </option>
              ))}
            </select>
            <div className="grid gap-2">
              {allowedSampleTransitions.length ? (
                allowedSampleTransitions.map((rule) => (
                  <Button
                    className="gap-2"
                    key={`${rule.from}-${rule.to}`}
                    disabled={isMutating}
                    tone="secondary"
                    onClick={() => transitionSample(rule.to as SampleRecord["status"], rule.actor!)}
                  >
                    <FlaskConical className="size-4" />
                    {t("actions.moveTo", { status: t(`sampleStatus.${rule.to}`), role: t(`roles.${rule.actor!.role}`) })}
                  </Button>
                ))
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">{t("actions.noSampleAction")}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow={t("actions.resultsEyebrow")}>{t("actions.resultsTitle")}</SectionHeading>
          <div className="mt-6 grid gap-4">
            <select
              aria-label={t("actions.selectResult")}
              className="min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-sm text-[var(--color-text)]"
              value={selectedResultId}
              onChange={(event) => setSelectedResultId(event.target.value)}
            >
              <option value="">{t("actions.selectResult")}</option>
              {snapshot.results.map((result) => (
                <option key={result.id} value={result.id}>
                  {result.testName} - {t(`resultStatus.${result.status}`)}
                </option>
              ))}
            </select>
            <Button className="gap-2" disabled={isMutating} tone="secondary" onClick={validateResult}>
              <CheckCircle2 className="size-4" />
              {t("actions.validateResult")}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow={t("actions.alertsEyebrow")}>{t("actions.alertsTitle")}</SectionHeading>
          <div className="mt-6 grid gap-4">
            <select
              aria-label={t("actions.selectAlert")}
              className="min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-sm text-[var(--color-text)]"
              value={selectedAlertId}
              onChange={(event) => setSelectedAlertId(event.target.value)}
            >
              <option value="">{t("actions.selectAlert")}</option>
              {snapshot.criticalAlerts.map((alert) => (
                <option key={alert.id} value={alert.id}>
                  {alert.id} - {alert.status}
                </option>
              ))}
            </select>
            <Button className="gap-2" disabled={isMutating} tone="secondary" onClick={acknowledgeAlert}>
              <AlertTriangle className="size-4" />
              {t("actions.acknowledgeAlert")}
            </Button>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-6">
          <SectionHeading eyebrow={t("actions.reportsEyebrow")}>{t("actions.reportsTitle")}</SectionHeading>
          <div className="mt-6 grid gap-4">
            <select
              aria-label={t("actions.selectReport")}
              className="min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-sm text-[var(--color-text)]"
              value={selectedReportId}
              onChange={(event) => setSelectedReportId(event.target.value)}
            >
              <option value="">{t("actions.selectReport")}</option>
              {snapshot.reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.reportNumber} - {t(`reportStatus.${report.status}`)}
                </option>
              ))}
            </select>
            <Button className="gap-2" disabled={releaseState.blocked || isMutating} onClick={releaseReport}>
              <FileCheck2 className="size-4" />
              {t("actions.releaseReport")}
            </Button>
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--color-text)]">{t("actions.amendmentNote")}</span>
              <textarea
                className="min-h-24 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] p-3 text-sm text-[var(--color-text)]"
                value={amendmentNote}
                onChange={(event) => setAmendmentNote(event.target.value)}
              />
            </label>
            <Button
              className="gap-2"
              disabled={!selectedReport || (selectedReport.status !== "released" && selectedReport.status !== "amended") || isMutating}
              tone="secondary"
              onClick={amendReport}
            >
              <FilePenLine className="size-4" />
              {t("actions.amendReleased")}
            </Button>
            {releaseState.blocked && selectedReport ? (
              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-muted)] p-4 text-sm text-[var(--color-text-muted)]">
                {t("ops.critical")}: {releaseState.reasons.join(" · ")}
              </div>
            ) : null}
            {selectedReportAmendments.length ? (
              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-muted)] p-4 text-sm text-[var(--color-text-muted)]">
                {selectedReportAmendments.map((entry) => (
                  <p key={entry.id}>
                    v{entry.version}: {entry.note}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow={t("actions.auditPreviewEyebrow")}>{t("actions.auditPreviewTitle")}</SectionHeading>
          <div className="mt-6 grid gap-3 text-sm">
            {snapshot.auditLogs.length ? (
              snapshot.auditLogs.slice(0, 5).map((entry) => (
                <div className="rounded-[18px] bg-[var(--color-panel-muted)] p-4" key={entry.id}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--color-text)]">{entry.action}</p>
                      <p className="mt-1 text-[var(--color-text-muted)]">
                        {entry.entityType} / {entry.entityId}
                      </p>
                    </div>
                    <span className="shrink-0 text-[var(--color-text-muted)]">{formatDateTime(entry.createdAt, intlLocale)}</span>
                  </div>
                  <p className="mt-3 text-[var(--color-text-muted)]">
                    {t("actions.recordedBy", { actor: entry.actorName, role: t(`roles.${entry.actorRole}`) })}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[18px] bg-[var(--color-panel-muted)] p-4 text-sm text-[var(--color-text-muted)]">
                {t("actions.noEvents")}
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function CommandMetric({ icon, label, value, tone = "default" }: { icon: ReactNode; label: string; value: number; tone?: "default" | "danger" }) {
  return (
    <div className="rounded-[18px] border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-full bg-[var(--color-accent-surface)] text-[var(--color-text)]",
          tone === "danger" && "text-[var(--color-danger)]"
        )}
      >
        {icon}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 font-[var(--font-display)] text-3xl tabular-nums text-[var(--color-text)]">{value}</p>
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[16px] bg-[var(--color-panel-muted)] px-4 py-3">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="truncate font-medium text-[var(--color-text)]">{value}</span>
    </div>
  );
}

function QueueRow({ icon, label, value, tone = "default" }: { icon: ReactNode; label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-[var(--color-panel-muted)] p-4">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-panel)] text-[var(--color-text)]",
          tone === "danger" && "text-[var(--color-danger)]"
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-[var(--color-text)]">{label}</p>
        <p className="mt-1 text-[var(--color-text-muted)]">{value}</p>
      </div>
    </div>
  );
}
