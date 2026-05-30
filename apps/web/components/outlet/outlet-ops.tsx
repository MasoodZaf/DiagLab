"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import {
  BellRing,
  CalendarCheck,
  CreditCard,
  DoorOpen,
  FileText,
  FlaskConical,
  Home,
  LogOut,
  MapPin,
  Syringe,
  UserRound
} from "lucide-react";
import type { UserRole } from "@lab/contracts";
import { Badge, Button, Card, cn, type BadgeTone } from "@lab/ui";
import { getTranslator, localeMeta, type Locale } from "../../lib/i18n";
import { withParams } from "../../lib/url";
import { AppControls } from "../controls/app-controls";

export type OutletJourney = {
  orderId: string;
  orderNumber: string;
  patientName: string;
  mrn: string;
  tests: string[];
  branchName: string;
  homeCollection: boolean;
  done: { booked: boolean; collected: boolean; processed: boolean; reported: boolean; paid: boolean };
  recallSuggested: boolean;
};

type OutletInfo = { id: string; name: string; city: string };

type OutletOpsProps = {
  journeys: OutletJourney[];
  outlets: OutletInfo[];
  selectedOutletId: string;
  brandName: string;
  operatorName: string;
  role: UserRole;
  locale: Locale;
  intlLocale: string;
};

type StageKey = "booked" | "collected" | "processed" | "reported" | "paid" | "discharged" | "recall";

const STAGE_ICONS: Record<StageKey, ComponentType<{ className?: string }>> = {
  booked: CalendarCheck,
  collected: Syringe,
  processed: FlaskConical,
  reported: FileText,
  paid: CreditCard,
  discharged: DoorOpen,
  recall: BellRing
};

function matchesBranch(branchName: string, outlet: OutletInfo) {
  if (!branchName) return false;
  const b = branchName.toLowerCase();
  const name = outlet.name.toLowerCase();
  const city = outlet.city.toLowerCase();
  return name.includes(b) || b.includes(city) || city === b || name.split(" ")[0] === b.split(" ")[0];
}

export function OutletOps({ journeys, outlets, selectedOutletId, brandName, operatorName, role, locale, intlLocale }: OutletOpsProps) {
  const t = getTranslator(locale);
  const dir = localeMeta[locale].dir;
  const [branch, setBranch] = useState<string>(selectedOutletId || "all");
  const [discharged, setDischarged] = useState<Record<string, boolean>>({});
  const [recall, setRecall] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const j of journeys) init[j.orderId] = j.recallSuggested;
    return init;
  });

  const selectedOutlet = outlets.find((o) => o.id === branch);
  const visible = useMemo(
    () => (branch === "all" || !selectedOutlet ? journeys : journeys.filter((j) => matchesBranch(j.branchName, selectedOutlet))),
    [branch, selectedOutlet, journeys]
  );

  const isDischarged = (j: OutletJourney) => discharged[j.orderId] ?? false;
  const isRecall = (j: OutletJourney) => recall[j.orderId] ?? false;

  const kpis = useMemo(() => {
    const patients = new Set(visible.map((j) => j.mrn)).size;
    return {
      patients,
      activeOrders: visible.length,
      awaitingCollection: visible.filter((j) => !j.done.collected).length,
      inLab: visible.filter((j) => j.done.collected && !j.done.reported).length,
      awaitingPayment: visible.filter((j) => !j.done.paid).length,
      readyDischarge: visible.filter((j) => j.done.reported && j.done.paid && !isDischarged(j)).length,
      recall: visible.filter((j) => isRecall(j)).length
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, discharged, recall]);

  const stageLabel: Record<StageKey, string> = {
    booked: t("outlet.stageBooked"),
    collected: t("outlet.stageCollected"),
    processed: t("outlet.stageProcessed"),
    reported: t("outlet.stageReported"),
    paid: t("outlet.stagePaid"),
    discharged: t("outlet.stageDischarged"),
    recall: t("outlet.stageRecall")
  };

  const signOutHref = withParams("/outlet/login", { lang: locale });

  return (
    <div lang={locale} dir={dir} className="min-h-dvh bg-[var(--color-canvas)] text-[var(--color-text)]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--color-line)] bg-[var(--color-panel)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--color-primary)] font-[var(--font-display)] text-lg font-bold text-[var(--color-primary-foreground)]">
              {brandName.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{t("outlet.workspace")}</p>
              <p className="truncate font-[var(--font-display)] text-lg leading-none text-[var(--color-text)]">{brandName}</p>
            </div>
          </div>

          <div className="ms-auto flex flex-wrap items-center gap-3">
            <div className="hidden text-end sm:block">
              <p className="text-xs text-[var(--color-text-muted)]">{t("outlet.signedInAt")}</p>
              <p className="text-sm font-medium text-[var(--color-text)]">
                {selectedOutlet?.name ?? t("outlet.allBranches")} · {t(`roles.${role}`)}
              </p>
            </div>
            <AppControls locale={locale} themeLabel={t("controls.toggleTheme")} languageLabel={t("controls.selectLanguage")} />
            <Link
              href={signOutHref}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--color-line)] px-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
            >
              <LogOut className="size-4 rtl:-scale-x-100" />
              {t("outlet.signOut")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">{t("outlet.title")}</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">{t("outlet.subtitle")}</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{t("outlet.branchFilter")}</span>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="min-h-10 rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:border-[var(--color-primary)]"
            >
              <option value="all">{t("outlet.allBranches")}</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </label>
        </div>

        {/* KPIs */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Kpi label={t("outlet.kpiActiveOrders")} value={kpis.activeOrders} tone="primary" />
          <Kpi label={t("outlet.kpiAwaitingCollection")} value={kpis.awaitingCollection} tone="info" />
          <Kpi label={t("outlet.kpiInLab")} value={kpis.inLab} tone="info" />
          <Kpi label={t("outlet.kpiAwaitingPayment")} value={kpis.awaitingPayment} tone="warning" />
          <Kpi label={t("outlet.kpiReadyDischarge")} value={kpis.readyDischarge} tone="success" />
          <Kpi label={t("outlet.kpiRecall")} value={kpis.recall} tone={kpis.recall ? "danger" : "neutral"} />
        </div>

        {/* Journeys */}
        <div className="mt-6 grid gap-3">
          {visible.length === 0 ? (
            <Card className="p-8 text-center text-sm text-[var(--color-text-muted)]">{t("outlet.empty")}</Card>
          ) : (
            visible.map((j) => {
              const stages: Array<{ key: StageKey; done: boolean }> = [
                { key: "booked", done: j.done.booked },
                { key: "collected", done: j.done.collected },
                { key: "processed", done: j.done.processed },
                { key: "reported", done: j.done.reported },
                { key: "paid", done: j.done.paid },
                { key: "discharged", done: isDischarged(j) },
                { key: "recall", done: isRecall(j) }
              ];
              const currentIndex = stages.findIndex((s) => !s.done);

              return (
                <Card key={j.orderId} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-[var(--color-accent-surface)] text-[var(--color-primary)]">
                        <UserRound className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--color-text)]">{j.patientName}</p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {t("outlet.mrn")} {j.mrn} · {t("outlet.order")} {j.orderNumber}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                          <MapPin className="size-3.5" /> {j.branchName || "—"}
                          {j.homeCollection ? <span className="inline-flex items-center gap-1 ms-1"><Home className="size-3.5" /> {t("outlet.homeCollection")}</span> : null}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {j.tests.map((test) => (
                        <Badge key={test} tone="neutral">{test}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Stepper */}
                  <div className="mt-5 flex items-stretch gap-1 overflow-x-auto pb-1">
                    {stages.map((stage, idx) => {
                      const Icon = STAGE_ICONS[stage.key];
                      const isCurrent = idx === currentIndex;
                      const isRecallStage = stage.key === "recall";
                      const tone = stage.done
                        ? isRecallStage
                          ? "danger"
                          : "done"
                        : isCurrent
                          ? "current"
                          : "pending";
                      return (
                        <div key={stage.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                          <div className="flex w-full items-center">
                            <span className={cn("h-0.5 flex-1", idx === 0 ? "opacity-0" : stage.done || isCurrent ? "bg-[var(--color-primary)]" : "bg-[var(--color-line)]")} />
                            <span
                              className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                                tone === "done" && "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
                                tone === "danger" && "border-[var(--color-danger)] bg-[var(--color-danger)] text-white",
                                tone === "current" && "border-[var(--color-primary)] bg-[var(--color-accent-surface)] text-[var(--color-primary)]",
                                tone === "pending" && "border-[var(--color-line)] bg-[var(--color-panel)] text-[var(--color-text-muted)]"
                              )}
                            >
                              <Icon className="size-[18px]" />
                            </span>
                            <span className={cn("h-0.5 flex-1", idx === stages.length - 1 ? "opacity-0" : stage.done ? "bg-[var(--color-primary)]" : "bg-[var(--color-line)]")} />
                          </div>
                          <span className={cn("text-center text-[11px] leading-tight", stage.done || isCurrent ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]")}>
                            {stageLabel[stage.key]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Discharge + recall actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-line)] pt-4">
                    <Button
                      size="sm"
                      tone={isDischarged(j) ? "secondary" : "primary"}
                      disabled={!isDischarged(j) && !(j.done.reported && j.done.paid)}
                      onClick={() => setDischarged((m) => ({ ...m, [j.orderId]: !isDischarged(j) }))}
                      className="gap-1.5"
                    >
                      <DoorOpen className="size-4" />
                      {isDischarged(j) ? t("outlet.undoDischarge") : t("outlet.markDischarged")}
                    </Button>
                    <Button
                      size="sm"
                      tone={isRecall(j) ? "danger" : "ghost"}
                      onClick={() => setRecall((m) => ({ ...m, [j.orderId]: !isRecall(j) }))}
                      className="gap-1.5"
                    >
                      <BellRing className="size-4" />
                      {isRecall(j) ? t("outlet.clearRecall") : t("outlet.flagRecall")}
                    </Button>
                    {isRecall(j) ? <span className="text-xs text-[var(--color-danger)]">{t("outlet.recallReason")}</span> : null}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <p className="mt-5 text-center text-xs text-[var(--color-text-muted)]">{t("outlet.demoStateNote")}</p>
      </main>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: BadgeTone }) {
  const accent: Record<BadgeTone, string> = {
    neutral: "text-[var(--color-text)]",
    primary: "text-[var(--color-primary)]",
    success: "text-[var(--color-success)]",
    warning: "text-[var(--color-warning)]",
    danger: "text-[var(--color-danger)]",
    info: "text-[var(--color-primary)]"
  };
  return (
    <Card className="p-4" flat>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className={cn("mt-2 font-[var(--font-display)] text-2xl tabular-nums", accent[tone])}>{value}</p>
    </Card>
  );
}
