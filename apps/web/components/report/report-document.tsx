import {
  BadgeCheck,
  FlaskConical,
  ShieldCheck,
  Stethoscope,
  Sparkles
} from "lucide-react";
import type {
  OrderRecord,
  PatientRecord,
  ReportRecord,
  ResultRecord,
  SampleRecord,
  TenantConfig
} from "@lab/contracts";
import { Badge, Card, cn } from "@lab/ui";
import { QrCode } from "../qr-code";
import { formatDateTime } from "../../lib/format";
import type { Translator } from "../../lib/i18n";

type ReportDocumentProps = {
  tenant: TenantConfig;
  patient?: PatientRecord;
  order: OrderRecord;
  results: ResultRecord[];
  sample?: SampleRecord;
  report?: ReportRecord;
  intlLocale: string;
  t: Translator;
};

type ResultFlag = {
  tone: "neutral" | "warning" | "danger";
  label: string;
};

const PENDING_DASH = "—";

/** Splits a stored value like "9.1 %" or "22 ng/mL" into value + unit parts. */
function splitValue(raw: string): { value: string; unit: string } {
  const trimmed = raw.trim();
  const match = trimmed.match(/^([\d.,<>=+\-\s]+)\s+(.+)$/);
  if (match) {
    return { value: match[1].trim(), unit: match[2].trim() };
  }
  return { value: trimmed, unit: "" };
}

/** Whole-year age from an ISO date of birth. */
function ageFromDob(dob?: string): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

/** Short uppercase verification token derived from the report/order number. */
function verificationCode(seed: string): string {
  const clean = seed.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const suffix = hash.toString(36).toUpperCase().padStart(4, "0").slice(-4);
  const head = clean.slice(-4).padStart(4, "0");
  return `${head}-${suffix}`;
}

function resultFlag(result: ResultRecord, t: Translator): ResultFlag {
  if (result.critical) {
    return { tone: "danger", label: t("report.criticalFlag") };
  }
  if (result.abnormal) {
    const { value } = splitValue(result.value);
    const numeric = Number.parseFloat(value.replace(/[<>=]/g, ""));
    const bounds = result.referenceRange.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (!Number.isNaN(numeric) && bounds) {
      const upper = Number.parseFloat(bounds[2]);
      const isHigh = numeric > upper;
      return { tone: "warning", label: isHigh ? t("report.high") : t("report.low") };
    }
    return { tone: "warning", label: t("report.high") };
  }
  return { tone: "neutral", label: t("report.normal") };
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-s-2 border-[var(--color-line)] ps-3">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="text-sm font-medium text-[var(--color-text)] tabular-nums">{value}</dd>
    </div>
  );
}

export function ReportDocument({
  tenant,
  patient,
  order,
  results,
  sample,
  report,
  intlLocale,
  t
}: ReportDocumentProps) {
  const reportNumber = report?.reportNumber ?? order.orderNumber;
  const verifyDomain = `verify.${tenant.slug}.aura.health`;
  const verifyUrl = `https://${verifyDomain}/r/${reportNumber}`;
  const code = verificationCode(reportNumber);
  const isReleased = report?.status === "released";

  const age = ageFromDob(patient?.dateOfBirth);
  const sexLabel = patient?.sex
    ? patient.sex.charAt(0).toUpperCase() + patient.sex.slice(1)
    : PENDING_DASH;
  const ageSex = age !== undefined ? `${age} / ${sexLabel}` : sexLabel;

  const collected =
    formatDateTime(sample?.collectedAt, intlLocale, tenant.timezone) ?? t("common.pending");
  const reported =
    formatDateTime(report?.releasedAt, intlLocale, tenant.timezone) ?? t("common.pending");

  const validator =
    report?.releasedBy ??
    results.find((r) => r.validatorName)?.validatorName ??
    t("common.pending");

  const hasCritical = results.some((r) => r.critical);
  const hasAbnormal = results.some((r) => r.abnormal && !r.critical);
  const aiEnabled = tenant.features.aiPatientExplanation;

  const interpretation = hasCritical
    ? "One or more analytes fall in a critical range that warrants urgent clinical correlation. The supervising pathologist has been notified and the ordering clinician should be contacted without delay."
    : hasAbnormal
      ? "Selected analytes lie outside the established reference interval. Findings should be interpreted alongside the patient's clinical history, current medication and prior trends."
      : "All reported analytes fall within their reference intervals. No action is indicated on the basis of these results; correlate with clinical presentation as appropriate.";

  const aiSummary = hasCritical
    ? "One of your results is much higher than the healthy range and needs attention soon. Please contact your doctor or this lab quickly so they can advise you on the next steps."
    : hasAbnormal
      ? "Some of your results are a little outside the usual range. This does not always mean a problem — your doctor will look at these numbers together with how you feel and decide if anything is needed."
      : "Good news — your results are all within the normal, healthy range. There is nothing here that needs action right now. Keep up your routine and follow your doctor's general advice.";

  return (
    <article className="flex flex-col gap-8 text-[var(--color-text)]">
      {/* Header: brand + verification */}
      <header className="flex flex-col gap-6 border-b border-[var(--color-line)] pb-7 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-2xl font-semibold text-[var(--color-primary-foreground)] shadow-card"
            aria-hidden="true"
          >
            {tenant.logos.square}
          </span>
          <div className="flex flex-col gap-1.5">
            <h1 className="font-[var(--font-display)] text-2xl font-semibold leading-tight">
              {tenant.brandName}
            </h1>
            <p className="max-w-xs text-xs leading-relaxed text-[var(--color-text-muted)]">
              {tenant.reportTemplate.headerLabel}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
              <FlaskConical className="size-3.5" aria-hidden="true" />
              {t("report.title")}
            </p>
          </div>
        </div>

        <Card
          flat
          className="flex flex-col items-center gap-2 bg-[var(--color-panel-muted)] p-4 text-center"
        >
          <div className="rounded-xl bg-white p-2 shadow-card">
            <QrCode value={verifyUrl} size={120} />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            {t("report.scanToVerify")}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            <span className="font-semibold text-[var(--color-text)]">
              {t("report.verificationCode")}:
            </span>{" "}
            <span className="tabular-nums tracking-wide">{code}</span>
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            {t("report.verifyAt")} {verifyDomain}
          </p>
          {isReleased ? (
            <Badge tone="success" dot>
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              {t("report.verified")}
            </Badge>
          ) : null}
        </Card>
      </header>

      {/* Patient demographics */}
      <section aria-label={t("report.patient")}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3">
          <KeyValue label={t("report.reportNo")} value={reportNumber} />
          <KeyValue label={t("report.orderNo")} value={order.orderNumber} />
          <KeyValue label={t("report.mrn")} value={patient?.mrn ?? PENDING_DASH} />
          <KeyValue label={t("report.patient")} value={patient?.fullName ?? PENDING_DASH} />
          <KeyValue label={t("report.age")} value={ageSex} />
          <KeyValue
            label={t("report.referredBy")}
            value={order.branchName ? `${order.branchName}` : "Self / Walk-in"}
          />
          <KeyValue label={t("report.collected")} value={collected} />
          <KeyValue label={t("report.reported")} value={reported} />
          {sample ? <KeyValue label="Specimen" value={sample.specimen} /> : null}
        </dl>
      </section>

      {/* Results table */}
      <section aria-label={t("report.result")}>
        {results.length > 0 ? (
          <div className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-line)]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--color-panel-muted)] text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  <th className="px-4 py-3 text-start font-semibold">{t("report.test")}</th>
                  <th className="px-4 py-3 text-end font-semibold">{t("report.result")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("report.unit")}</th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {t("report.referenceRange")}
                  </th>
                  <th className="px-4 py-3 text-end font-semibold">{t("report.flag")}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => {
                  const { value, unit } = splitValue(result.value);
                  const flag = resultFlag(result, t);
                  const emphasised = result.critical || result.abnormal;
                  return (
                    <tr
                      key={result.id}
                      className={cn(
                        "border-t border-[var(--color-line)] align-top",
                        result.critical &&
                          "bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)]",
                        result.abnormal &&
                          !result.critical &&
                          "bg-[color-mix(in_srgb,var(--color-warning)_8%,transparent)]"
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                        {result.testName}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-end tabular-nums",
                          emphasised
                            ? "font-semibold text-[var(--color-text)]"
                            : "text-[var(--color-text)]"
                        )}
                      >
                        {value}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">
                        {unit || PENDING_DASH}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[var(--color-text-muted)]">
                        {result.referenceRange}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Badge tone={flag.tone} dot={flag.tone !== "neutral"}>
                          {flag.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Card flat className="bg-[var(--color-panel-muted)] p-6 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              {t("common.pending")} — no validated analytes are available for this order yet.
            </p>
          </Card>
        )}
      </section>

      {/* Interpretation */}
      <section className="flex flex-col gap-2.5">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          <Stethoscope className="size-3.5" aria-hidden="true" />
          {t("report.interpretation")}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-text)]">{interpretation}</p>
      </section>

      {/* AI patient summary */}
      {aiEnabled ? (
        <section aria-label={t("report.aiSummary")}>
          <Card
            flat
            className="bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] p-5"
          >
            <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {t("report.aiSummary")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">{aiSummary}</p>
            <p className="mt-3 border-t border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] pt-2 text-[10px] leading-relaxed text-[var(--color-text-muted)]">
              {t("report.aiDisclaimer")}
            </p>
          </Card>
        </section>
      ) : null}

      {/* Footer: validation, signature, confidentiality */}
      <footer className="mt-2 flex flex-col gap-6 border-t border-[var(--color-line)] pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              {t("report.validatedBy")}
            </p>
            <p className="font-[var(--font-display)] text-lg italic leading-tight text-[var(--color-text)]">
              {validator}
            </p>
            <span
              className="mt-1 h-px w-48 bg-[var(--color-text)]"
              aria-hidden="true"
            />
          </div>
          <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <ShieldCheck className="size-4 text-[var(--color-success)]" aria-hidden="true" />
            <span className="text-[11px] font-medium uppercase tracking-[0.1em]">
              {t("report.confidential")}
            </span>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)]">
          {tenant.reportTemplate.footerNote}
        </p>
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {t("report.endOfReport")}
        </p>
      </footer>
    </article>
  );
}
