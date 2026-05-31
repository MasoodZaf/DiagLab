import { ShieldAlert } from "lucide-react";
import { Card } from "@lab/ui";
import { OpsShell } from "../../components/ops-shell";
import { Configurator, type ConfiguratorLabels } from "../../components/admin/configurator";
import { getAppContext } from "../../lib/session";
import { getTenantDomainData } from "../../lib/domain";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const { tenant, actor, locale, t, intlLocale } = getAppContext(sp, {
    defaultRole: "super_admin"
  });
  const { snapshot } = await getTenantDomainData(tenant);

  // RBAC: the white-label configurator is a super-admin–only surface.
  if (actor.role !== "super_admin") {
    return (
      <OpsShell active="admin" actor={actor} snapshot={snapshot} tenant={tenant} locale={locale}>
        <Card className="mx-auto max-w-xl p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-danger)_14%,transparent)] text-[var(--color-danger)]">
            <ShieldAlert className="size-6" />
          </div>
          <h2 className="mt-5 font-[var(--font-display)] text-2xl text-[var(--color-text)]">
            {t("admin.restrictedTitle")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{t("admin.restrictedBody")}</p>
        </Card>
      </OpsShell>
    );
  }

  const labels: ConfiguratorLabels = {
    title: t("admin.title"),
    subtitle: t("admin.subtitle"),
    identity: t("admin.identity"),
    brandName: t("admin.brandName"),
    palette: t("admin.palette"),
    primary: t("admin.primary"),
    canvas: t("admin.canvas"),
    radius: t("admin.radius"),
    preview: t("admin.preview"),
    features: t("admin.features"),
    policies: t("admin.policies"),
    notifications: t("admin.notifications"),
    audit: t("admin.audit"),
    domains: t("admin.domains"),
    locale: t("admin.locale"),
    featureMatrix: t("admin.featureMatrix"),
    livePreviewNote: t("admin.livePreviewNote"),
    applyBrand: t("admin.applyBrand"),
    enabled: t("common.enabled"),
    disabled: t("common.disabled"),
    save: t("common.save"),
    pending: t("common.pending"),
    // Static control labels resolved on the server (client cannot call t).
    densityComfortable: t("adminConfig.densityComfortable"),
    densityCompact: t("adminConfig.densityCompact"),
    density: t("adminConfig.density"),
    featureNames: {
      onlineBooking: t("adminConfig.featureNames.onlineBooking"),
      homeCollection: t("adminConfig.featureNames.homeCollection"),
      payments: t("adminConfig.featureNames.payments"),
      aiPatientExplanation: t("adminConfig.featureNames.aiPatientExplanation"),
      aiResultSummary: t("adminConfig.featureNames.aiResultSummary"),
      phlebotomyApp: t("adminConfig.featureNames.phlebotomyApp")
    },
    policyNames: {
      allowCreditBilling: t("adminConfig.policyNames.allowCreditBilling"),
      requireOtpForReports: t("adminConfig.policyNames.requireOtpForReports"),
      requirePathologistApproval: t("adminConfig.policyNames.requirePathologistApproval"),
      enableCriticalCallLogging: t("adminConfig.policyNames.enableCriticalCallLogging")
    },
    previewReportHeader: t("adminConfig.previewReportHeader"),
    previewReportSub: t("adminConfig.previewReportSub"),
    previewPatient: t("adminConfig.previewPatient"),
    previewSamplePassed: t("adminConfig.previewSamplePassed"),
    previewSamplePending: t("adminConfig.previewSamplePending"),
    previewInvoice: t("adminConfig.previewInvoice"),
    previewPrimaryCta: t("adminConfig.previewPrimaryCta"),
    previewSecondaryCta: t("adminConfig.previewSecondaryCta"),
    appliedConfirmation: t("adminConfig.appliedConfirmation"),
    auditAction: t("adminConfig.auditAction"),
    auditEntity: t("adminConfig.auditEntity"),
    auditActor: t("adminConfig.auditActor"),
    auditWhen: t("adminConfig.auditWhen"),
    auditEmpty: t("adminConfig.auditEmpty"),
    emailFrom: t("adminConfig.emailFrom"),
    smsSender: t("adminConfig.smsSender"),
    whatsappSender: t("adminConfig.whatsappSender"),
    templatesLabel: t("adminConfig.templatesLabel"),
    matrixOn: t("common.enabled"),
    matrixOff: t("common.disabled")
  };

  return (
    <OpsShell active="admin" actor={actor} snapshot={snapshot} tenant={tenant} locale={locale}>
      <Configurator
        tenant={tenant}
        labels={labels}
        intlLocale={intlLocale}
        auditLogs={snapshot.auditLogs.slice(0, 8).map((entry) => ({
          id: entry.id,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          actorName: entry.actorName,
          actorRole: entry.actorRole,
          createdAt: entry.createdAt
        }))}
        notifications={tenant.notifications}
        features={tenant.features}
        policies={tenant.policies}
      />
    </OpsShell>
  );
}
