"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  FilePenLine,
  FilePlus2,
  FlaskConical,
  ShieldCheck,
  Stethoscope,
  TestTube,
  UserCog,
  UserPlus
} from "lucide-react";
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
  /** The currently signed-in role's actor — every action runs as this actor, so
   * the server's role guards are genuinely exercised and the cards shown reflect
   * exactly what this role may do. Switching role in the top bar changes this. */
  actor: SessionActor;
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

type ResultForm = {
  testName: string;
  value: string;
  referenceRange: string;
  abnormal: boolean;
  critical: boolean;
};

type DoctorForm = {
  name: string;
  specialty: string;
  qualification: string;
};

type StaffForm = {
  name: string;
  role: UserRole;
  phone: string;
  email: string;
};

const defaultRegistration: RegistrationForm = {
  fullName: "Sara Noor",
  phone: "+92 300 555 8765",
  nationalId: "35202-9999999-1",
  tests: "CBC, TSH",
  totalAmount: "5400",
  homeCollection: true
};

const defaultResult: ResultForm = { testName: "CBC", value: "", referenceRange: "4.0 - 11.0", abnormal: false, critical: false };
const defaultDoctor: DoctorForm = { name: "", specialty: "", qualification: "" };
const defaultStaff: StaffForm = { name: "", role: "receptionist", phone: "", email: "" };

const STAFF_ROLE_OPTIONS: UserRole[] = ["receptionist", "phlebotomist", "rider", "technician", "pathologist", "branch_manager"];

function cloneSnapshot(snapshot: TenantSnapshot): TenantSnapshot {
  return structuredClone(snapshot);
}

export function WorkflowActionCenter({ tenant, locale, actor, initialSnapshot }: WorkflowActionCenterProps) {
  const t = getTranslator(locale);
  const router = useRouter();
  const intlLocale = localeMeta[locale].intlLocale;
  const role = actor.role;

  const [snapshot, setSnapshot] = useState<TenantSnapshot>(() => cloneSnapshot(initialSnapshot));
  const [form, setForm] = useState<RegistrationForm>(defaultRegistration);
  const [resultForm, setResultForm] = useState<ResultForm>(defaultResult);
  const [doctorForm, setDoctorForm] = useState<DoctorForm>(defaultDoctor);
  const [staffForm, setStaffForm] = useState<StaffForm>(defaultStaff);
  const [orderExistingMode, setOrderExistingMode] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(initialSnapshot.patients[0]?.id ?? "");
  const [selectedSampleId, setSelectedSampleId] = useState(
    initialSnapshot.samples.find((sample) => sample.status === "processing" || sample.status === "verified")?.id ?? initialSnapshot.samples[0]?.id ?? ""
  );
  const [selectedResultId, setSelectedResultId] = useState(initialSnapshot.results.find((result) => result.status !== "validated")?.id ?? "");
  const [selectedAlertId, setSelectedAlertId] = useState(initialSnapshot.criticalAlerts.find((a) => a.status === "open")?.id ?? initialSnapshot.criticalAlerts[0]?.id ?? "");
  const [selectedReportId, setSelectedReportId] = useState(initialSnapshot.reports[0]?.id ?? "");
  const [selectedOrderId, setSelectedOrderId] = useState(initialSnapshot.orders.find((o) => o.status === "awaiting_release")?.id ?? initialSnapshot.orders[0]?.id ?? "");
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

  // What this role may do — drives which action cards render.
  const can = {
    register: role === "receptionist" || role === "super_admin",
    pay: role === "receptionist" || role === "patient" || role === "super_admin",
    moveSample: sampleWorkflowRules.some((rule) => rule.allowedRoles.includes(role)),
    enterResult: role === "technician" || role === "super_admin",
    validate: role === "pathologist" || role === "super_admin",
    acknowledge: role === "pathologist" || role === "super_admin",
    draftReport: role === "pathologist" || role === "super_admin",
    release: role === "pathologist",
    amend: role === "pathologist" || role === "super_admin",
    managePanel: role === "lab_admin" || role === "super_admin"
  };
  const hasActions = Object.values(can).some(Boolean);

  const releaseState = useMemo(() => {
    if (!selectedReport) {
      return { blocked: true, reasons: [] as string[] };
    }
    const orderResults = snapshot.results.filter((result) => result.orderId === selectedReport.orderId);
    const blockingAlerts = snapshot.criticalAlerts.filter((alert) => alert.status === "open" && orderResults.some((result) => result.id === alert.resultId));
    const invalidResults = orderResults.filter((result) => result.status !== "validated" && result.status !== "released");
    const reasons = [...blockingAlerts.map(() => t("ops.dashboard.openAlerts")), ...invalidResults.map((result) => `${result.testName}`)];
    return { blocked: reasons.length > 0, reasons };
  }, [selectedReport, snapshot.criticalAlerts, snapshot.results]);

  // Only the transitions THIS role is allowed to perform on the selected sample.
  const allowedSampleTransitions = useMemo(() => {
    if (!selectedSample) return [];
    return sampleWorkflowRules.filter((rule) => rule.from === selectedSample.status && rule.allowedRoles.includes(role));
  }, [selectedSample, role]);

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
      const response = await fetch(path, { ...init, headers: { "content-type": "application/json", ...init.headers } });
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
      // Refresh server components (dashboard KPIs, registries) so the whole page reflects the change.
      router.refresh();
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
    const payloadBase = { actor, tests, totalAmount: Number(form.totalAmount) || 0, homeCollection: form.homeCollection };
    const nextSnapshot = orderExistingMode
      ? await runMutation(
          `/api/workflow/orders/existing?tenant=${tenant.slug}`,
          { method: "POST", body: JSON.stringify({ ...payloadBase, patientId: selectedPatientId }) },
          "Unable to create order"
        )
      : await runMutation(
          `/api/workflow/orders?tenant=${tenant.slug}`,
          { method: "POST", body: JSON.stringify({ ...payloadBase, fullName: form.fullName, phone: form.phone, nationalId: form.nationalId }) },
          "Unable to register patient"
        );
    const latestSample = nextSnapshot?.samples.at(-1);
    if (latestSample) setSelectedSampleId(latestSample.id);
  }

  async function transitionSample(nextStatus: SampleRecord["status"]) {
    if (!selectedSample) return;
    await runMutation(
      `/api/workflow/samples/${selectedSample.id}?tenant=${tenant.slug}`,
      { method: "PATCH", body: JSON.stringify({ actor, nextStatus }) },
      "Unable to transition sample"
    );
  }

  async function enterResult() {
    if (!selectedSample) {
      showMessage(t("actions.selectedSample"), "error");
      return;
    }
    if (!resultForm.testName.trim() || !resultForm.value.trim()) {
      showMessage(t("status.fieldsRequired"), "error");
      return;
    }
    await runMutation(
      `/api/workflow/results?tenant=${tenant.slug}`,
      { method: "POST", body: JSON.stringify({ actor, sampleId: selectedSample.id, ...resultForm }) },
      "Unable to enter result"
    );
  }

  async function validateResult() {
    const result = snapshot.results.find((entry) => entry.id === selectedResultId);
    if (!result) {
      showMessage(t("actions.selectResult"), "error");
      return;
    }
    await runMutation(`/api/workflow/results/${result.id}?tenant=${tenant.slug}`, { method: "PATCH", body: JSON.stringify({ actor }) }, "Unable to validate result");
  }

  async function acknowledgeAlert() {
    const alert = snapshot.criticalAlerts.find((entry) => entry.id === selectedAlertId);
    if (!alert) {
      showMessage(t("actions.selectAlert"), "error");
      return;
    }
    await runMutation(`/api/workflow/alerts/${alert.id}/acknowledge?tenant=${tenant.slug}`, { method: "POST", body: JSON.stringify({ actor }) }, "Unable to acknowledge alert");
  }

  async function recordPayment() {
    const invoice = snapshot.invoices.find((entry) => entry.id === selectedInvoiceId);
    if (!invoice) {
      showMessage(t("actions.selectInvoice"), "error");
      return;
    }
    const outstanding = invoice.totalAmount - invoice.paidAmount;
    const amount = paymentAmount ? Number(paymentAmount) : outstanding;
    await runMutation(`/api/workflow/invoices/${invoice.id}/payments?tenant=${tenant.slug}`, { method: "POST", body: JSON.stringify({ actor, amount }) }, "Unable to record payment");
    setPaymentAmount("");
  }

  async function draftReport() {
    if (!selectedOrderId) {
      showMessage(t("actions.selectOrder"), "error");
      return;
    }
    await runMutation(`/api/workflow/reports?tenant=${tenant.slug}`, { method: "POST", body: JSON.stringify({ actor, orderId: selectedOrderId }) }, "Unable to draft report");
  }

  async function releaseReport() {
    if (!selectedReport || releaseState.blocked) {
      showMessage(releaseState.reasons[0] ?? t("actions.selectReport"), "error");
      return;
    }
    await runMutation(`/api/workflow/reports/${selectedReport.id}/release?tenant=${tenant.slug}`, { method: "POST", body: JSON.stringify({ actor }) }, "Unable to release report");
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
    await runMutation(`/api/workflow/reports/${selectedReport.id}/amend?tenant=${tenant.slug}`, { method: "POST", body: JSON.stringify({ actor, note: amendmentNote }) }, "Unable to amend report");
  }

  async function addDoctor() {
    if (!doctorForm.name.trim() || !doctorForm.specialty.trim()) {
      showMessage(t("status.fieldsRequired"), "error");
      return;
    }
    await runMutation(`/api/workflow/doctors?tenant=${tenant.slug}`, { method: "POST", body: JSON.stringify({ actor, ...doctorForm }) }, "Unable to add doctor");
    setDoctorForm(defaultDoctor);
  }

  async function addStaff() {
    if (!staffForm.name.trim()) {
      showMessage(t("status.fieldsRequired"), "error");
      return;
    }
    await runMutation(`/api/workflow/staff?tenant=${tenant.slug}`, { method: "POST", body: JSON.stringify({ actor, ...staffForm }) }, "Unable to add staff");
    setStaffForm(defaultStaff);
  }

  const inputCls = "min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-sm text-[var(--color-text)]";

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-[var(--color-line)] bg-[var(--color-panel-muted)] px-6 py-5">
            <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">{t("actions.roleConsoleEyebrow", { role: t(`roles.${role}`) })}</p>
            <h2 className="mt-2 text-balance font-[var(--font-display)] text-4xl text-[var(--color-text)]">{t("actions.title")}</h2>
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
            <StatusLine label={t("actions.selectedSample")} value={selectedSample?.barcode ?? t("common.none")} />
            <StatusLine label={t("common.signedInAs")} value={`${actor.displayName} · ${t(`roles.${role}`)}`} />
          </div>
        </Card>
      </section>

      {!hasActions ? (
        <Card className="p-6">
          <SectionHeading eyebrow={t("actions.roleConsoleEyebrow", { role: t(`roles.${role}`) })}>{t("actions.noRoleActionsTitle")}</SectionHeading>
          <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">{t("actions.noRoleActionsBody")}</p>
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {can.register ? (
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <SectionHeading eyebrow={t("actions.registrationEyebrow")}>
                {orderExistingMode ? t("actions.orderExistingTitle") : t("actions.registrationTitle")}
              </SectionHeading>
              <Button tone="ghost" className="text-xs" onClick={() => setOrderExistingMode((v) => !v)}>
                {orderExistingMode ? t("actions.switchToNewPatient") : t("actions.switchToExisting")}
              </Button>
            </div>
            <div className="mt-6 grid gap-4">
              {orderExistingMode ? (
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-[var(--color-text)]">{t("actions.selectPatient")}</span>
                  <select className={inputCls} value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
                    {snapshot.patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} · {p.mrn}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-[var(--color-text)]">{t("actions.patientName")}</span>
                    <input className={inputCls} value={form.fullName} onChange={(e) => updateForm("fullName", e.target.value)} />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-[var(--color-text)]">{t("actions.phone")}</span>
                      <input className={inputCls} value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} />
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-[var(--color-text)]">{t("actions.cnic")}</span>
                      <input className={inputCls} value={form.nationalId} onChange={(e) => updateForm("nationalId", e.target.value)} />
                    </label>
                  </div>
                </>
              )}
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-[var(--color-text)]">{t("actions.tests")}</span>
                  <input className={inputCls} value={form.tests} onChange={(e) => updateForm("tests", e.target.value)} />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-[var(--color-text)]">{t("actions.amount")}</span>
                  <input className={inputCls} inputMode="numeric" value={form.totalAmount} onChange={(e) => updateForm("totalAmount", e.target.value)} />
                </label>
              </div>
              <label className="flex items-center gap-3 text-sm text-[var(--color-text)]">
                <input checked={form.homeCollection} className="size-4" type="checkbox" onChange={(e) => updateForm("homeCollection", e.target.checked)} />
                {t("actions.homeCollection")}
              </label>
              <Button className="gap-2" disabled={isMutating} onClick={registerPatientAndOrder}>
                <UserPlus className="size-4" />
                {orderExistingMode ? t("actions.createOrder") : t("actions.registerPatient")}
              </Button>
            </div>
          </Card>
        ) : null}

        {can.moveSample ? (
          <Card className="p-6">
            <SectionHeading eyebrow={t("actions.samplesEyebrow")}>{t("actions.samplesTitle")}</SectionHeading>
            <div className="mt-6 grid gap-4">
              <select aria-label={t("actions.samplesTitle")} className={inputCls} value={selectedSampleId} onChange={(e) => setSelectedSampleId(e.target.value)}>
                {snapshot.samples.map((sample) => (
                  <option key={sample.id} value={sample.id}>
                    {sample.barcode} - {t(`sampleStatus.${sample.status}`)}
                  </option>
                ))}
              </select>
              <div className="grid gap-2">
                {allowedSampleTransitions.length ? (
                  allowedSampleTransitions.map((rule) => (
                    <Button className="gap-2" key={`${rule.from}-${rule.to}`} disabled={isMutating} tone="secondary" onClick={() => transitionSample(rule.to as SampleRecord["status"])}>
                      <FlaskConical className="size-4" />
                      {t("actions.moveToShort", { status: t(`sampleStatus.${rule.to}`) })}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)]">{t("actions.noSampleAction")}</p>
                )}
              </div>
            </div>
          </Card>
        ) : null}

        {can.enterResult ? (
          <Card className="p-6">
            <SectionHeading eyebrow={t("actions.enterResultEyebrow")}>{t("actions.enterResultTitle")}</SectionHeading>
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--color-text)]">{t("actions.samplesTitle")}</span>
                <select className={inputCls} value={selectedSampleId} onChange={(e) => setSelectedSampleId(e.target.value)}>
                  {snapshot.samples.map((sample) => (
                    <option key={sample.id} value={sample.id}>
                      {sample.barcode} - {t(`sampleStatus.${sample.status}`)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-[var(--color-text)]">{t("actions.testName")}</span>
                  <input className={inputCls} value={resultForm.testName} onChange={(e) => setResultForm((c) => ({ ...c, testName: e.target.value }))} />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-[var(--color-text)]">{t("actions.resultValue")}</span>
                  <input className={inputCls} value={resultForm.value} onChange={(e) => setResultForm((c) => ({ ...c, value: e.target.value }))} />
                </label>
              </div>
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--color-text)]">{t("actions.referenceRange")}</span>
                <input className={inputCls} value={resultForm.referenceRange} onChange={(e) => setResultForm((c) => ({ ...c, referenceRange: e.target.value }))} />
              </label>
              <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text)]">
                <label className="flex items-center gap-2">
                  <input checked={resultForm.abnormal} className="size-4" type="checkbox" onChange={(e) => setResultForm((c) => ({ ...c, abnormal: e.target.checked }))} />
                  {t("actions.abnormalFlag")}
                </label>
                <label className="flex items-center gap-2">
                  <input checked={resultForm.critical} className="size-4" type="checkbox" onChange={(e) => setResultForm((c) => ({ ...c, critical: e.target.checked }))} />
                  {t("actions.criticalFlag")}
                </label>
              </div>
              <Button className="gap-2" disabled={isMutating} tone="secondary" onClick={enterResult}>
                <TestTube className="size-4" />
                {t("actions.enterResultButton")}
              </Button>
            </div>
          </Card>
        ) : null}

        {can.validate ? (
          <Card className="p-6">
            <SectionHeading eyebrow={t("actions.resultsEyebrow")}>{t("actions.resultsTitle")}</SectionHeading>
            <div className="mt-6 grid gap-4">
              <select aria-label={t("actions.selectResult")} className={inputCls} value={selectedResultId} onChange={(e) => setSelectedResultId(e.target.value)}>
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
        ) : null}

        {can.acknowledge ? (
          <Card className="p-6">
            <SectionHeading eyebrow={t("actions.alertsEyebrow")}>{t("actions.alertsTitle")}</SectionHeading>
            <div className="mt-6 grid gap-4">
              <select aria-label={t("actions.selectAlert")} className={inputCls} value={selectedAlertId} onChange={(e) => setSelectedAlertId(e.target.value)}>
                <option value="">{t("actions.selectAlert")}</option>
                {snapshot.criticalAlerts.map((alert) => (
                  <option key={alert.id} value={alert.id}>
                    {alert.id} - {t(`alertStatus.${alert.status}`)}
                  </option>
                ))}
              </select>
              <Button className="gap-2" disabled={isMutating} tone="secondary" onClick={acknowledgeAlert}>
                <AlertTriangle className="size-4" />
                {t("actions.acknowledgeAlert")}
              </Button>
            </div>
          </Card>
        ) : null}

        {can.pay ? (
          <Card className="p-6">
            <SectionHeading eyebrow={t("actions.billingEyebrow")}>{t("actions.billingTitle")}</SectionHeading>
            <div className="mt-6 grid gap-4">
              <select aria-label={t("actions.selectInvoice")} className={inputCls} value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)}>
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
                  className={inputCls}
                  inputMode="decimal"
                  placeholder={
                    selectedInvoice
                      ? t("actions.outstanding", { amount: formatMoney(selectedInvoice.totalAmount - selectedInvoice.paidAmount, selectedInvoice.currency, intlLocale) })
                      : t("actions.paymentAmount")
                  }
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </label>
              <Button className="gap-2" disabled={!selectedInvoice || selectedInvoice.status === "paid" || isMutating} tone="secondary" onClick={recordPayment}>
                <CreditCard className="size-4" />
                {t("actions.recordPayment")}
              </Button>
            </div>
          </Card>
        ) : null}

        {can.draftReport || can.release || can.amend ? (
          <Card className="p-6 xl:col-span-2">
            <SectionHeading eyebrow={t("actions.reportsEyebrow")}>{t("actions.reportsTitle")}</SectionHeading>
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              <div className="grid gap-4">
                {can.draftReport ? (
                  <div className="grid gap-2">
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-[var(--color-text)]">{t("actions.selectOrder")}</span>
                      <select className={inputCls} value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}>
                        {snapshot.orders.map((order) => (
                          <option key={order.id} value={order.id}>
                            {order.orderNumber} - {t(`orderStatus.${order.status}`)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button className="gap-2" disabled={isMutating} tone="secondary" onClick={draftReport}>
                      <FilePlus2 className="size-4" />
                      {t("actions.draftReportButton")}
                    </Button>
                  </div>
                ) : null}
                <select aria-label={t("actions.selectReport")} className={inputCls} value={selectedReportId} onChange={(e) => setSelectedReportId(e.target.value)}>
                  <option value="">{t("actions.selectReport")}</option>
                  {snapshot.reports.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.reportNumber} - {t(`reportStatus.${report.status}`)}
                    </option>
                  ))}
                </select>
                {can.release ? (
                  <Button className="gap-2" disabled={releaseState.blocked || isMutating} onClick={releaseReport}>
                    <FileCheck2 className="size-4" />
                    {t("actions.releaseReport")}
                  </Button>
                ) : null}
                {releaseState.blocked && selectedReport ? (
                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-muted)] p-4 text-sm text-[var(--color-text-muted)]">
                    {t("ops.critical")}: {releaseState.reasons.join(" · ")}
                  </div>
                ) : null}
              </div>
              {can.amend ? (
                <div className="grid gap-4">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-[var(--color-text)]">{t("actions.amendmentNote")}</span>
                    <textarea className="min-h-24 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] p-3 text-sm text-[var(--color-text)]" value={amendmentNote} onChange={(e) => setAmendmentNote(e.target.value)} />
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
              ) : null}
            </div>
          </Card>
        ) : null}

        {can.managePanel ? (
          <>
            <Card className="p-6">
              <SectionHeading eyebrow={t("actions.panelEyebrow")}>{t("actions.addDoctorTitle")}</SectionHeading>
              <div className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-[var(--color-text)]">{t("actions.doctorName")}</span>
                  <input className={inputCls} value={doctorForm.name} onChange={(e) => setDoctorForm((c) => ({ ...c, name: e.target.value }))} placeholder="Dr. …" />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-[var(--color-text)]">{t("actions.specialty")}</span>
                    <input className={inputCls} value={doctorForm.specialty} onChange={(e) => setDoctorForm((c) => ({ ...c, specialty: e.target.value }))} />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-[var(--color-text)]">{t("actions.qualification")}</span>
                    <input className={inputCls} value={doctorForm.qualification} onChange={(e) => setDoctorForm((c) => ({ ...c, qualification: e.target.value }))} />
                  </label>
                </div>
                <Button className="gap-2" disabled={isMutating} onClick={addDoctor}>
                  <Stethoscope className="size-4" />
                  {t("actions.addDoctorButton")}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <SectionHeading eyebrow={t("actions.teamEyebrow")}>{t("actions.addStaffTitle")}</SectionHeading>
              <div className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-[var(--color-text)]">{t("actions.staffName")}</span>
                  <input className={inputCls} value={staffForm.name} onChange={(e) => setStaffForm((c) => ({ ...c, name: e.target.value }))} />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-[var(--color-text)]">{t("actions.staffRole")}</span>
                  <select className={inputCls} value={staffForm.role} onChange={(e) => setStaffForm((c) => ({ ...c, role: e.target.value as UserRole }))}>
                    {STAFF_ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {t(`roles.${r}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-[var(--color-text)]">{t("actions.phone")}</span>
                    <input className={inputCls} value={staffForm.phone} onChange={(e) => setStaffForm((c) => ({ ...c, phone: e.target.value }))} />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-[var(--color-text)]">{t("actions.email")}</span>
                    <input className={inputCls} value={staffForm.email} onChange={(e) => setStaffForm((c) => ({ ...c, email: e.target.value }))} />
                  </label>
                </div>
                <Button className="gap-2" disabled={isMutating} onClick={addStaff}>
                  <UserCog className="size-4" />
                  {t("actions.addStaffButton")}
                </Button>
              </div>
            </Card>
          </>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <SectionHeading eyebrow={t("actions.workQueueEyebrow")}>{t("actions.workQueueTitle")}</SectionHeading>
          <div className="mt-6 grid gap-3 text-sm">
            <QueueRow icon={<CreditCard className="size-4" />} label={t("actions.paymentConfirmation")} value={`${unpaidInvoices} ${t("actions.unitInvoices")}`} />
            <QueueRow icon={<ShieldCheck className="size-4" />} label={t("actions.clinicalRelease")} value={`${pendingReports} ${t("actions.unitDraftReports")}`} />
            <QueueRow icon={<Activity className="size-4" />} label={t("actions.criticalEscalation")} value={`${openAlerts} ${t("actions.unitAlerts")}`} tone={openAlerts ? "danger" : "default"} />
            <QueueRow icon={<BadgeCheck className="size-4" />} label={t("actions.auditTrailLabel")} value={`${snapshot.auditLogs.length} ${t("actions.unitEvents")}`} />
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
                  <p className="mt-3 text-[var(--color-text-muted)]">{t("actions.recordedBy", { actor: entry.actorName, role: t(`roles.${entry.actorRole}`) })}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[18px] bg-[var(--color-panel-muted)] p-4 text-sm text-[var(--color-text-muted)]">{t("actions.noEvents")}</div>
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
      <div className={cn("flex size-9 items-center justify-center rounded-full bg-[var(--color-accent-surface)] text-[var(--color-text)]", tone === "danger" && "text-[var(--color-danger)]")}>{icon}</div>
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
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-panel)] text-[var(--color-text)]", tone === "danger" && "text-[var(--color-danger)]")}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate font-medium text-[var(--color-text)]">{label}</p>
        <p className="mt-1 text-[var(--color-text-muted)]">{value}</p>
      </div>
    </div>
  );
}
