"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type {
  TenantConfig,
  TenantFeatures,
  TenantPolicies,
  NotificationTemplates,
  UserRole
} from "@lab/contracts";
import { Badge, Button, Card, SectionHeading, cn } from "@lab/ui";
import {
  Activity,
  CheckCircle2,
  FileText,
  Globe,
  Receipt,
  ScrollText,
  ShieldCheck,
  Sparkles,
  User
} from "lucide-react";

type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string;
  actorRole: UserRole;
  createdAt: string;
};

export type ConfiguratorLabels = {
  title: string;
  subtitle: string;
  identity: string;
  brandName: string;
  palette: string;
  primary: string;
  canvas: string;
  radius: string;
  preview: string;
  features: string;
  policies: string;
  notifications: string;
  audit: string;
  domains: string;
  locale: string;
  featureMatrix: string;
  livePreviewNote: string;
  applyBrand: string;
  enabled: string;
  disabled: string;
  save: string;
  pending: string;
  densityComfortable: string;
  densityCompact: string;
  density: string;
  featureNames: Record<keyof TenantFeatures, string>;
  policyNames: Record<keyof TenantPolicies, string>;
  previewReportHeader: string;
  previewReportSub: string;
  previewPatient: string;
  previewSamplePassed: string;
  previewSamplePending: string;
  previewInvoice: string;
  previewPrimaryCta: string;
  previewSecondaryCta: string;
  appliedConfirmation: string;
  auditAction: string;
  auditEntity: string;
  auditActor: string;
  auditWhen: string;
  auditEmpty: string;
  emailFrom: string;
  smsSender: string;
  whatsappSender: string;
  templatesLabel: string;
  matrixOn: string;
  matrixOff: string;
};

type ConfiguratorProps = {
  tenant: TenantConfig;
  labels: ConfiguratorLabels;
  intlLocale: string;
  auditLogs: AuditEntry[];
  notifications: NotificationTemplates;
  features: TenantFeatures;
  policies: TenantPolicies;
};

const featureOrder: Array<keyof TenantFeatures> = [
  "onlineBooking",
  "homeCollection",
  "payments",
  "aiPatientExplanation",
  "aiResultSummary",
  "phlebotomyApp"
];

const policyOrder: Array<keyof TenantPolicies> = [
  "allowCreditBilling",
  "requireOtpForReports",
  "requirePathologistApproval",
  "enableCriticalCallLogging"
];

function parseRadius(raw: string): number {
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) return 18;
  return Math.min(28, Math.max(6, value));
}

const microLabel = "text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]";

function Toggle({
  label,
  checked,
  onToggle,
  onLabel,
  offLabel
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-start transition-colors",
        checked
          ? "border-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-line))] bg-[var(--color-accent-surface)]"
          : "border-[var(--color-line)] bg-[var(--color-panel-muted)] hover:border-[var(--color-line)]"
      )}
    >
      <span className="min-w-0 truncate text-sm font-medium text-[var(--color-text)]">{label}</span>
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wide",
            checked ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
          )}
        >
          {checked ? onLabel : offLabel}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
            checked ? "bg-[var(--color-primary)]" : "bg-[color-mix(in_srgb,var(--color-text-muted)_40%,transparent)]"
          )}
        >
          <span
            className={cn(
              "inline-block size-3.5 rounded-full bg-[var(--color-panel)] shadow-card transition-transform",
              checked ? "translate-x-[18px]" : "translate-x-1"
            )}
          />
        </span>
      </span>
    </button>
  );
}

export function Configurator({
  tenant,
  labels,
  intlLocale,
  auditLogs,
  notifications,
  features,
  policies
}: ConfiguratorProps) {
  const [brandName, setBrandName] = useState(tenant.brandName);
  const [primary, setPrimary] = useState(tenant.tokens.colorPrimary);
  const [primaryFg] = useState(tenant.tokens.colorPrimaryForeground);
  const [canvas, setCanvas] = useState(tenant.tokens.colorCanvas);
  const [radius, setRadius] = useState(parseRadius(tenant.tokens.radius));
  const [density, setDensity] = useState<"comfortable" | "compact">(tenant.tokens.density);
  const [featureState, setFeatureState] = useState<TenantFeatures>({ ...features });
  const [policyState, setPolicyState] = useState<TenantPolicies>({ ...policies });
  const [applied, setApplied] = useState(false);

  const previewStyle = useMemo(
    () =>
      ({
        ["--color-primary"]: primary,
        ["--color-primary-foreground"]: primaryFg,
        ["--color-canvas"]: canvas,
        ["--color-accent-surface"]: `color-mix(in srgb, ${primary} 12%, var(--color-panel))`,
        ["--radius-panel"]: `${radius}px`
      }) as CSSProperties,
    [primary, primaryFg, canvas, radius]
  );

  const dateFormatter = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
    }
  }, [intlLocale]);

  const formatWhen = (iso: string) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : dateFormatter.format(date);
  };

  const toggleFeature = (key: keyof TenantFeatures) => {
    setFeatureState((prev) => ({ ...prev, [key]: !prev[key] }));
    setApplied(false);
  };
  const togglePolicy = (key: keyof TenantPolicies) => {
    setPolicyState((prev) => ({ ...prev, [key]: !prev[key] }));
    setApplied(false);
  };

  const padScale = density === "compact" ? "p-4" : "p-5";
  const sampleTemplates = Object.entries(notifications.templates).slice(0, 2);

  return (
    <div className="grid gap-4">
      <div>
        <p className={microLabel}>{labels.identity}</p>
        <h2 className="mt-2 text-balance font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">
          {labels.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">{labels.subtitle}</p>
      </div>

      {/* Split: controls (start) + live preview (end) */}
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        {/* CONTROLS */}
        <Card className="p-6">
          <SectionHeading eyebrow={labels.palette}>{labels.identity}</SectionHeading>

          <div className="mt-6 grid gap-5">
            <label className="grid gap-2">
              <span className={microLabel}>{labels.brandName}</span>
              <input
                type="text"
                value={brandName}
                onChange={(event) => {
                  setBrandName(event.target.value);
                  setApplied(false);
                }}
                className="min-h-11 rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-muted)] px-4 text-sm text-[var(--color-text)] outline-none transition-colors focus-visible:border-[var(--color-primary)]"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className={microLabel}>{labels.primary}</span>
                <span className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-muted)] px-3 py-2">
                  <input
                    type="color"
                    aria-label={labels.primary}
                    value={primary}
                    onChange={(event) => {
                      setPrimary(event.target.value);
                      setApplied(false);
                    }}
                    className="size-9 shrink-0 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent p-0"
                  />
                  <span className="font-mono text-xs uppercase tabular-nums text-[var(--color-text-muted)]">
                    {primary}
                  </span>
                </span>
              </label>

              <label className="grid gap-2">
                <span className={microLabel}>{labels.canvas}</span>
                <span className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-muted)] px-3 py-2">
                  <input
                    type="color"
                    aria-label={labels.canvas}
                    value={canvas}
                    onChange={(event) => {
                      setCanvas(event.target.value);
                      setApplied(false);
                    }}
                    className="size-9 shrink-0 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent p-0"
                  />
                  <span className="font-mono text-xs uppercase tabular-nums text-[var(--color-text-muted)]">
                    {canvas}
                  </span>
                </span>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="flex items-center justify-between">
                <span className={microLabel}>{labels.radius}</span>
                <span className="text-xs font-semibold tabular-nums text-[var(--color-text)]">{radius}px</span>
              </span>
              <input
                type="range"
                min={6}
                max={28}
                step={1}
                value={radius}
                aria-label={labels.radius}
                onChange={(event) => {
                  setRadius(Number(event.target.value));
                  setApplied(false);
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-panel-muted)] accent-[var(--color-primary)]"
              />
            </label>

            <label className="grid gap-2">
              <span className={microLabel}>{labels.density}</span>
              <select
                value={density}
                aria-label={labels.density}
                onChange={(event) => {
                  setDensity(event.target.value as "comfortable" | "compact");
                  setApplied(false);
                }}
                className="min-h-11 rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-muted)] px-4 text-sm text-[var(--color-text)] outline-none transition-colors focus-visible:border-[var(--color-primary)]"
              >
                <option value="comfortable">{labels.densityComfortable}</option>
                <option value="compact">{labels.densityCompact}</option>
              </select>
            </label>
          </div>

          <div className="mt-7 border-t border-[var(--color-line)] pt-6">
            <p className={microLabel}>{labels.features}</p>
            <div className="mt-4 grid gap-2.5">
              {featureOrder.map((key) => (
                <Toggle
                  key={key}
                  label={labels.featureNames[key]}
                  checked={featureState[key]}
                  onToggle={() => toggleFeature(key)}
                  onLabel={labels.enabled}
                  offLabel={labels.disabled}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--color-line)] pt-6">
            <p className={microLabel}>{labels.policies}</p>
            <div className="mt-4 grid gap-2.5">
              {policyOrder.map((key) => (
                <Toggle
                  key={key}
                  label={labels.policyNames[key]}
                  checked={policyState[key]}
                  onToggle={() => togglePolicy(key)}
                  onLabel={labels.enabled}
                  offLabel={labels.disabled}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* LIVE PREVIEW */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-6 py-4">
            <div className="flex items-center gap-2.5">
              <Sparkles aria-hidden="true" className="size-4 text-[var(--color-primary)]" />
              <p className={microLabel}>{labels.preview}</p>
            </div>
            <Badge tone="primary" dot>
              {density === "compact" ? labels.densityCompact : labels.densityComfortable}
            </Badge>
          </div>

          <div
            style={previewStyle}
            data-density={density}
            className="bg-[var(--color-canvas)] p-6"
          >
            {/* Report header tile */}
            <div
              className="border border-[var(--color-line)] bg-[var(--color-panel)] shadow-card"
              style={{ borderRadius: "var(--radius-panel)" }}
            >
              <div
                className={cn("flex items-center justify-between gap-4", padScale)}
                style={{
                  background: "var(--color-primary)",
                  color: "var(--color-primary-foreground)",
                  borderTopLeftRadius: "var(--radius-panel)",
                  borderTopRightRadius: "var(--radius-panel)"
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-10 items-center justify-center rounded-2xl font-[var(--font-display)] text-lg font-bold"
                    style={{
                      background: "color-mix(in srgb, var(--color-primary-foreground) 20%, transparent)"
                    }}
                  >
                    {tenant.logos.square}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-[var(--font-display)] text-base font-semibold leading-tight">
                      {brandName || tenant.brandName}
                    </p>
                    <p className="truncate text-xs opacity-80">{labels.previewReportSub}</p>
                  </div>
                </div>
                <FileText aria-hidden="true" className="size-5 opacity-80" />
              </div>

              <div className={cn("grid gap-4", padScale)}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-[var(--font-display)] text-sm font-semibold text-[var(--color-text)]">
                    {labels.previewReportHeader}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="success" dot>
                      {labels.previewSamplePassed}
                    </Badge>
                    <Badge tone="warning">{labels.previewSamplePending}</Badge>
                  </div>
                </div>

                {/* Patient card */}
                <div
                  className="flex items-center gap-3 border border-[var(--color-line)] bg-[var(--color-panel-muted)] p-4"
                  style={{ borderRadius: "var(--radius-panel)" }}
                >
                  <span
                    className="flex size-10 items-center justify-center rounded-full"
                    style={{ background: "color-mix(in srgb, var(--color-primary) 14%, var(--color-panel))" }}
                  >
                    <User aria-hidden="true" className="size-5 text-[var(--color-primary)]" />
                  </span>
                  <div className="min-w-0">
                    <p className={microLabel}>{labels.previewPatient}</p>
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">Ayesha Khan · MRN-4821</p>
                  </div>
                </div>

                {/* Mock invoice line */}
                <div
                  className="flex items-center justify-between gap-3 border border-[var(--color-line)] bg-[var(--color-panel)] p-4"
                  style={{ borderRadius: "var(--radius-panel)" }}
                >
                  <span className="flex items-center gap-2.5 text-sm text-[var(--color-text-muted)]">
                    <Receipt aria-hidden="true" className="size-4 text-[var(--color-primary)]" />
                    {labels.previewInvoice}
                  </span>
                  <span className="font-[var(--font-display)] text-base font-semibold tabular-nums text-[var(--color-text)]">
                    PKR 4,250
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button tone="primary" size="sm">
                    {labels.previewPrimaryCta}
                  </Button>
                  <Button tone="secondary" size="sm">
                    {labels.previewSecondaryCta}
                  </Button>
                </div>
              </div>
            </div>

            <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[var(--color-text-muted)]">
              <Activity aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-[var(--color-primary)]" />
              {labels.livePreviewNote}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button tone="primary" size="sm" onClick={() => setApplied(true)}>
                {labels.applyBrand}
              </Button>
              {applied ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-success)]">
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                  {labels.appliedConfirmation}
                </span>
              ) : null}
            </div>
          </div>
        </Card>
      </div>

      {/* Feature & policy matrix + tenant meta */}
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-6">
          <SectionHeading eyebrow={labels.featureMatrix}>{labels.features}</SectionHeading>
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {featureOrder.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-panel-muted)] px-4 py-3"
              >
                <span className="min-w-0 truncate text-sm text-[var(--color-text)]">{labels.featureNames[key]}</span>
                <Badge tone={featureState[key] ? "success" : "neutral"} dot={featureState[key]}>
                  {featureState[key] ? labels.matrixOn : labels.matrixOff}
                </Badge>
              </div>
            ))}
            {policyOrder.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-panel-muted)] px-4 py-3"
              >
                <span className="min-w-0 truncate text-sm text-[var(--color-text)]">{labels.policyNames[key]}</span>
                <Badge tone={policyState[key] ? "primary" : "neutral"} dot={policyState[key]}>
                  {policyState[key] ? labels.matrixOn : labels.matrixOff}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow={labels.domains}>{labels.locale}</SectionHeading>
          <div className="mt-6 grid gap-5">
            <div>
              <p className={microLabel}>{labels.domains}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tenant.domains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-panel-muted)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)]"
                  >
                    <Globe aria-hidden="true" className="size-3.5 text-[var(--color-primary)]" />
                    {domain}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-panel-muted)] px-4 py-3">
              <span className={microLabel}>{labels.locale}</span>
              <span className="text-sm font-medium tabular-nums text-[var(--color-text)]">{tenant.locale}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-panel-muted)] px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <ShieldCheck aria-hidden="true" className="size-4 text-[var(--color-primary)]" />
                {tenant.timezone}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Notification templates */}
      <Card className="p-6">
        <SectionHeading eyebrow={labels.notifications}>{labels.templatesLabel}</SectionHeading>
        <div className="mt-6 grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
          <div className="grid gap-3">
            <div className="rounded-xl bg-[var(--color-panel-muted)] p-4">
              <p className={microLabel}>{labels.emailFrom}</p>
              <p className="mt-1.5 text-sm font-medium text-[var(--color-text)]">{notifications.emailFromName}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-panel-muted)] p-4">
              <p className={microLabel}>{labels.smsSender}</p>
              <p className="mt-1.5 text-sm font-medium text-[var(--color-text)]">{notifications.smsSender}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-panel-muted)] p-4">
              <p className={microLabel}>{labels.whatsappSender}</p>
              <p className="mt-1.5 text-sm font-medium text-[var(--color-text)]">{notifications.whatsappSender}</p>
            </div>
          </div>
          <div className="grid gap-3">
            {sampleTemplates.map(([key, channels]) => {
              const channelEntries = Object.entries(channels);
              const primaryChannel = channelEntries[0]?.[1];
              return (
                <div key={key} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-muted)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-text)]">{key}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {channelEntries.map(([channel]) => (
                        <Badge key={channel} tone="info">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {primaryChannel?.subject ? (
                    <p className="mt-3 text-sm font-medium text-[var(--color-text)]">{primaryChannel.subject}</p>
                  ) : null}
                  {primaryChannel?.body ? (
                    <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-muted)]">{primaryChannel.body}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Audit log */}
      <Card className="p-6">
        <SectionHeading eyebrow={labels.audit}>{labels.audit}</SectionHeading>
        <div className="mt-6 overflow-x-auto">
          {auditLogs.length === 0 ? (
            <div className="rounded-xl bg-[var(--color-panel-muted)] px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
              <ScrollText aria-hidden="true" className="mx-auto mb-3 size-6 opacity-60" />
              {labels.auditEmpty}
            </div>
          ) : (
            <table className="min-w-full border-separate border-spacing-y-2 text-start text-sm">
              <thead>
                <tr className={microLabel}>
                  <th className="px-4 py-2 text-start font-semibold">{labels.auditWhen}</th>
                  <th className="px-4 py-2 text-start font-semibold">{labels.auditActor}</th>
                  <th className="px-4 py-2 text-start font-semibold">{labels.auditAction}</th>
                  <th className="px-4 py-2 text-start font-semibold">{labels.auditEntity}</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((entry) => (
                  <tr key={entry.id} className="bg-[var(--color-panel-muted)]">
                    <td className="rounded-s-xl px-4 py-3 tabular-nums text-[var(--color-text-muted)]">
                      {formatWhen(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-text)]">{entry.actorName}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{entry.actorRole}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{entry.action}</td>
                    <td className="rounded-e-xl px-4 py-3 text-[var(--color-text-muted)]">
                      {entry.entityType} / {entry.entityId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
