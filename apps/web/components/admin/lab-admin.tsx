"use client";

import { useState, type ReactNode } from "react";
import { Building2, KeyRound, MapPin, Phone, Plus, Stethoscope, Trash2, UserRound, X } from "lucide-react";
import {
  reagentStatus,
  weekdays,
  type ClinicSession,
  type DoctorAvailability,
  type Outlet,
  type OutletType,
  type PanelDoctor,
  type ReagentItem,
  type ReagentStatus,
  type StaffMember,
  type UserRole,
  type Weekday
} from "@lab/contracts";
import { Badge, Button, Card, SectionHeading, cn, type BadgeTone } from "@lab/ui";
import { formatMoney } from "../../lib/format";

type Option = { value: string; label: string };
type RoleOption = { value: UserRole; label: string };
type TestRow = { code: string; name: string; department: string; fee: number; offered: boolean; outletIds: string[] };

export type LabAdminLabels = {
  title: string;
  subtitle: string;
  tabOutlets: string;
  tabPanel: string;
  tabTeam: string;
  tabTests: string;
  outletsTitle: string;
  outletsSubtitle: string;
  addOutlet: string;
  outletName: string;
  city: string;
  type: string;
  address: string;
  phone: string;
  panelTitle: string;
  panelSubtitle: string;
  addDoctor: string;
  fullName: string;
  specialty: string;
  qualification: string;
  assignedOutlets: string;
  teamTitle: string;
  teamSubtitle: string;
  addStaff: string;
  role: string;
  outlet: string;
  status: string;
  testsTitle: string;
  testsSubtitle: string;
  addTest: string;
  code: string;
  test: string;
  department: string;
  fee: string;
  offered: string;
  add: string;
  cancel: string;
  statusActive: string;
  statusInactive: string;
  statusOnLeave: string;
  countOutlets: string;
  countDoctors: string;
  countStaff: string;
  countTests: string;
  email: string;
  loginAccess: string;
  enableLogin: string;
  loginActive: string;
  loginNone: string;
  availability: string;
  availabilityHint: string;
  remove: string;
  tabSchedule: string;
  tabInventory: string;
  scheduleTitle: string;
  scheduleSubtitle: string;
  inventoryTitle: string;
  inventorySubtitle: string;
  addReagent: string;
  reagentName: string;
  stock: string;
  unit: string;
  reorderLevel: string;
  stockOk: string;
  stockLow: string;
  stockOut: string;
  countReagents: string;
  countSchedule: string;
  sessionOff: string;
  sessionMorning: string;
  sessionEvening: string;
  sessionFull: string;
  dayMon: string;
  dayTue: string;
  dayWed: string;
  dayThu: string;
  dayFri: string;
  daySat: string;
  daySun: string;
};

type LabAdminProps = {
  outlets: Outlet[];
  doctors: PanelDoctor[];
  staff: StaffMember[];
  tests: Array<{ code: string; name: string; department: string; fee: number }>;
  schedule: DoctorAvailability[];
  inventory: ReagentItem[];
  currency: string;
  intlLocale: string;
  roleOptions: RoleOption[];
  outletTypeOptions: Array<{ value: OutletType; label: string }>;
  labels: LabAdminLabels;
};

type Tab = "outlets" | "panel" | "team" | "tests" | "schedule" | "inventory";

const SESSION_CYCLE: ClinicSession[] = ["off", "morning", "evening", "full_day"];

const field =
  "min-h-10 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]";
const micro = "mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]";

export function LabAdmin({ outlets: initialOutlets, doctors: initialDoctors, staff: initialStaff, tests: initialTests, schedule: initialSchedule, inventory: initialInventory, currency, intlLocale, roleOptions, outletTypeOptions, labels }: LabAdminProps) {
  const [tab, setTab] = useState<Tab>("outlets");
  const [outlets, setOutlets] = useState<Outlet[]>(initialOutlets);
  const [doctors, setDoctors] = useState<PanelDoctor[]>(initialDoctors);
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const seededOutletIds = initialOutlets.filter((o) => o.active).map((o) => o.id);
  const [tests, setTests] = useState<TestRow[]>(() => initialTests.map((t) => ({ ...t, offered: true, outletIds: seededOutletIds })));
  const [schedule, setSchedule] = useState<Record<string, ClinicSession>>(() => {
    const map: Record<string, ClinicSession> = {};
    for (const entry of initialSchedule) map[`${entry.doctorId}:${entry.day}`] = entry.session;
    return map;
  });
  const [inventory, setInventory] = useState<ReagentItem[]>(initialInventory);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [seq, setSeq] = useState(1);

  const tenantId = initialOutlets[0]?.tenantId ?? "tenant";
  const outletOptions: Option[] = outlets.map((o) => ({ value: o.id, label: `${o.name} · ${o.city}` }));
  const activeOutlets = outlets.filter((o) => o.active);
  const outletName = (id: string) => outlets.find((o) => o.id === id)?.name ?? id;

  function toggleStaffLogin(staffId: string) {
    setStaff((list) => list.map((s) => (s.id === staffId ? { ...s, loginEnabled: !s.loginEnabled } : s)));
  }

  const removeOutlet = (id: string) => setOutlets((list) => list.filter((o) => o.id !== id));
  const removeDoctor = (id: string) => setDoctors((list) => list.filter((d) => d.id !== id));
  const removeStaff = (id: string) => setStaff((list) => list.filter((s) => s.id !== id));
  const removeTest = (code: string) => setTests((list) => list.filter((row) => row.code !== code));
  const removeReagent = (id: string) => setInventory((list) => list.filter((r) => r.id !== id));

  function toggleTestOutlet(testIndex: number, outletId: string) {
    setTests((list) =>
      list.map((row, i) =>
        i === testIndex
          ? { ...row, outletIds: row.outletIds.includes(outletId) ? row.outletIds.filter((id) => id !== outletId) : [...row.outletIds, outletId] }
          : row
      )
    );
  }

  function cycleSession(doctorId: string, day: Weekday) {
    const key = `${doctorId}:${day}`;
    setSchedule((m) => {
      const current = m[key] ?? "off";
      const next = SESSION_CYCLE[(SESSION_CYCLE.indexOf(current) + 1) % SESSION_CYCLE.length];
      return { ...m, [key]: next };
    });
  }

  const dayColumns: Array<{ day: Weekday; label: string }> = weekdays.map((day) => ({
    day,
    label: labels[`day${cap(day)}` as keyof LabAdminLabels] as string
  }));

  const sessionLabel = (s: ClinicSession) =>
    s === "morning" ? labels.sessionMorning : s === "evening" ? labels.sessionEvening : s === "full_day" ? labels.sessionFull : labels.sessionOff;
  const sessionClass = (s: ClinicSession) =>
    s === "morning"
      ? "border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]"
      : s === "evening"
        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
        : s === "full_day"
          ? "border-[color-mix(in_srgb,var(--color-success)_32%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_16%,transparent)] text-[var(--color-success)]"
          : "border-[var(--color-line)] bg-[var(--color-panel)] text-[var(--color-text-muted)]";

  const reagentLabel: Record<ReagentStatus, string> = { ok: labels.stockOk, low: labels.stockLow, out: labels.stockOut };
  const reagentTone: Record<ReagentStatus, BadgeTone> = { ok: "success", low: "warning", out: "danger" };
  const scheduledCount = Object.values(schedule).filter((s) => s !== "off").length;
  const statusLabel = (s: string) => (s === "active" ? labels.statusActive : s === "on_leave" ? labels.statusOnLeave : labels.statusInactive);
  const statusTone = (s: string): BadgeTone => (s === "active" ? "success" : s === "on_leave" ? "warning" : "neutral");
  const nextId = (p: string) => `${p}_new_${seq}`;
  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "outlets", label: labels.tabOutlets },
    { id: "panel", label: labels.tabPanel },
    { id: "team", label: labels.tabTeam },
    { id: "tests", label: labels.tabTests },
    { id: "schedule", label: labels.tabSchedule },
    { id: "inventory", label: labels.tabInventory }
  ];

  function openAdd() {
    setDraft(
      tab === "outlets"
        ? { type: outletTypeOptions[0]?.value ?? "collection_center" }
        : tab === "team"
          ? { role: roleOptions[0]?.value ?? "receptionist", outletId: outlets[0]?.id ?? "" }
          : tab === "panel"
            ? { outletId: outlets[0]?.id ?? "" }
            : tab === "inventory"
              ? { outletId: outlets[0]?.id ?? "", unit: "kit" }
              : {}
    );
    setAdding(true);
  }

  function submitAdd() {
    if (tab === "outlets" && draft.name) {
      setOutlets((list) => [
        ...list,
        { id: nextId("out"), tenantId, name: draft.name, city: draft.city ?? "", type: (draft.type as OutletType) ?? "collection_center", phone: draft.phone, address: draft.address, active: true }
      ]);
    } else if (tab === "panel" && draft.name) {
      setDoctors((list) => [
        ...list,
        { id: nextId("doc"), tenantId, name: draft.name, specialty: draft.specialty ?? "", qualification: draft.qualification ?? "", outletIds: draft.outletId ? [draft.outletId] : [], status: "active" }
      ]);
    } else if (tab === "team" && draft.name) {
      setStaff((list) => [
        ...list,
        {
          id: nextId("stf"),
          tenantId,
          name: draft.name,
          role: (draft.role as UserRole) ?? "receptionist",
          outletId: draft.outletId ?? outlets[0]?.id ?? "",
          phone: draft.phone,
          status: "active",
          email: draft.email || undefined,
          loginEnabled: draft.loginEnabled === "1"
        }
      ]);
    } else if (tab === "tests" && draft.name) {
      setTests((list) => [
        ...list,
        { code: (draft.code || draft.name).toUpperCase().slice(0, 8), name: draft.name, department: draft.department || "—", fee: Number(draft.fee) || 0, offered: true, outletIds: activeOutlets.map((o) => o.id) }
      ]);
    } else if (tab === "inventory" && draft.name) {
      setInventory((list) => [
        ...list,
        { id: nextId("rgt"), tenantId, outletId: draft.outletId ?? outlets[0]?.id ?? "", name: draft.name, unit: draft.unit || "kit", stock: Number(draft.stock) || 0, reorderLevel: Number(draft.reorder) || 0 }
      ]);
    }
    setSeq((n) => n + 1);
    setAdding(false);
    setDraft({});
  }

  const counts = {
    outlets: `${outlets.length} ${labels.countOutlets}`,
    panel: `${doctors.length} ${labels.countDoctors}`,
    team: `${staff.length} ${labels.countStaff}`,
    tests: `${tests.filter((t) => t.offered).length} ${labels.countTests}`,
    schedule: `${scheduledCount} ${labels.countSchedule}`,
    inventory: `${inventory.length} ${labels.countReagents}`
  };

  const addLabel =
    tab === "outlets" ? labels.addOutlet : tab === "panel" ? labels.addDoctor : tab === "team" ? labels.addStaff : tab === "inventory" ? labels.addReagent : labels.addTest;
  const heading =
    tab === "outlets"
      ? { title: labels.outletsTitle, sub: labels.outletsSubtitle }
      : tab === "panel"
        ? { title: labels.panelTitle, sub: labels.panelSubtitle }
        : tab === "team"
          ? { title: labels.teamTitle, sub: labels.teamSubtitle }
          : tab === "schedule"
            ? { title: labels.scheduleTitle, sub: labels.scheduleSubtitle }
            : tab === "inventory"
              ? { title: labels.inventoryTitle, sub: labels.inventorySubtitle }
              : { title: labels.testsTitle, sub: labels.testsSubtitle };

  return (
    <div className="grid gap-4">
      <div>
        <p className={micro}>{labels.title}</p>
        <h2 className="mt-1 text-balance font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">{heading.title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">{labels.subtitle}</p>
      </div>

      {/* Tabs */}
      <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] p-1">
        {tabs.map((tEntry) => (
          <button
            key={tEntry.id}
            role="tab"
            aria-selected={tab === tEntry.id}
            onClick={() => {
              setTab(tEntry.id);
              setAdding(false);
            }}
            className={cn(
              "min-h-9 rounded-full px-4 text-sm font-medium transition-colors",
              tab === tEntry.id ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            {tEntry.label}
          </button>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading eyebrow={counts[tab]}>{heading.title}</SectionHeading>
          {tab === "schedule" ? null : (
            <Button size="sm" tone={tab === "tests" || tab === "inventory" ? "secondary" : "primary"} onClick={openAdd} className="gap-2">
              <Plus className="size-4" />
              {addLabel}
            </Button>
          )}
        </div>

        {/* Add form */}
        {adding ? (
          <div className="mt-5 rounded-[var(--radius-panel)] border border-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-line))] bg-[var(--color-panel-muted)] p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Labeled label={tab === "outlets" ? labels.outletName : tab === "tests" ? labels.test : tab === "inventory" ? labels.reagentName : labels.fullName}>
                <input className={field} value={draft.name ?? ""} onChange={(e) => set("name", e.target.value)} />
              </Labeled>

              {tab === "outlets" ? (
                <>
                  <Labeled label={labels.city}>
                    <input className={field} value={draft.city ?? ""} onChange={(e) => set("city", e.target.value)} />
                  </Labeled>
                  <Labeled label={labels.type}>
                    <select className={field} value={draft.type ?? ""} onChange={(e) => set("type", e.target.value)}>
                      {outletTypeOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Labeled>
                </>
              ) : null}

              {tab === "panel" ? (
                <>
                  <Labeled label={labels.specialty}>
                    <input className={field} value={draft.specialty ?? ""} onChange={(e) => set("specialty", e.target.value)} />
                  </Labeled>
                  <Labeled label={labels.qualification}>
                    <input className={field} value={draft.qualification ?? ""} onChange={(e) => set("qualification", e.target.value)} />
                  </Labeled>
                  <Labeled label={labels.outlet}>
                    <select className={field} value={draft.outletId ?? ""} onChange={(e) => set("outletId", e.target.value)}>
                      {outletOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Labeled>
                </>
              ) : null}

              {tab === "team" ? (
                <>
                  <Labeled label={labels.role}>
                    <select className={field} value={draft.role ?? ""} onChange={(e) => set("role", e.target.value)}>
                      {roleOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Labeled>
                  <Labeled label={labels.outlet}>
                    <select className={field} value={draft.outletId ?? ""} onChange={(e) => set("outletId", e.target.value)}>
                      {outletOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Labeled>
                  <Labeled label={labels.phone}>
                    <input className={field} value={draft.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
                  </Labeled>
                  <Labeled label={labels.email}>
                    <input className={field} type="email" value={draft.email ?? ""} onChange={(e) => set("email", e.target.value)} />
                  </Labeled>
                  <Labeled label={labels.loginAccess}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={draft.loginEnabled === "1"}
                      onClick={() => set("loginEnabled", draft.loginEnabled === "1" ? "" : "1")}
                      className={cn(
                        "flex min-h-10 w-full items-center justify-between rounded-xl border px-3 text-sm transition-colors",
                        draft.loginEnabled === "1"
                          ? "border-[var(--color-primary)] bg-[var(--color-accent-surface)] text-[var(--color-primary)]"
                          : "border-[var(--color-line)] bg-[var(--color-panel)] text-[var(--color-text-muted)]"
                      )}
                    >
                      <span>{draft.loginEnabled === "1" ? labels.loginActive : labels.enableLogin}</span>
                      <span
                        className={cn(
                          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                          draft.loginEnabled === "1" ? "bg-[var(--color-primary)]" : "bg-[color-mix(in_srgb,var(--color-text-muted)_40%,transparent)]"
                        )}
                      >
                        <span className={cn("inline-block size-3.5 rounded-full bg-[var(--color-panel)] transition-transform", draft.loginEnabled === "1" ? "translate-x-[18px]" : "translate-x-1")} />
                      </span>
                    </button>
                  </Labeled>
                </>
              ) : null}

              {tab === "tests" ? (
                <>
                  <Labeled label={labels.department}>
                    <input className={field} value={draft.department ?? ""} onChange={(e) => set("department", e.target.value)} />
                  </Labeled>
                  <Labeled label={`${labels.fee} (${currency})`}>
                    <input className={field} inputMode="numeric" value={draft.fee ?? ""} onChange={(e) => set("fee", e.target.value)} />
                  </Labeled>
                </>
              ) : null}

              {tab === "inventory" ? (
                <>
                  <Labeled label={labels.outlet}>
                    <select className={field} value={draft.outletId ?? ""} onChange={(e) => set("outletId", e.target.value)}>
                      {outletOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Labeled>
                  <Labeled label={labels.unit}>
                    <input className={field} value={draft.unit ?? ""} onChange={(e) => set("unit", e.target.value)} />
                  </Labeled>
                  <Labeled label={labels.stock}>
                    <input className={field} inputMode="numeric" value={draft.stock ?? ""} onChange={(e) => set("stock", e.target.value)} />
                  </Labeled>
                  <Labeled label={labels.reorderLevel}>
                    <input className={field} inputMode="numeric" value={draft.reorder ?? ""} onChange={(e) => set("reorder", e.target.value)} />
                  </Labeled>
                </>
              ) : null}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" onClick={submitAdd} disabled={!draft.name}>{labels.add}</Button>
              <Button size="sm" tone="ghost" onClick={() => setAdding(false)} className="gap-1">
                <X className="size-4" />
                {labels.cancel}
              </Button>
            </div>
          </div>
        ) : null}

        {/* Lists */}
        <div className="mt-6 grid gap-3">
          {tab === "outlets" &&
            outlets.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-accent-surface)] text-[var(--color-primary)]">
                  <Building2 className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-text)]">{o.name}</p>
                  <p className="flex items-center gap-1 text-sm text-[var(--color-text-muted)]">
                    <MapPin className="size-3.5" /> {o.city}
                    {o.phone ? <span className="ms-2 inline-flex items-center gap-1"><Phone className="size-3.5" /> {o.phone}</span> : null}
                  </p>
                </div>
                <Badge tone="info" className="ms-auto">
                  {outletTypeOptions.find((t) => t.value === o.type)?.label ?? o.type}
                </Badge>
                <span className="text-sm tabular-nums text-[var(--color-text-muted)]">
                  {staff.filter((s) => s.outletId === o.id).length} · {labels.tabTeam}
                </span>
                <DeleteButton label={labels.remove} onClick={() => removeOutlet(o.id)} />
              </div>
            ))}

          {tab === "panel" &&
            doctors.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-4">
                <span className="flex size-10 items-center justify-center rounded-full bg-[var(--color-accent-surface)] text-[var(--color-primary)]">
                  <Stethoscope className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-text)]">{d.name}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{d.specialty} · {d.qualification}</p>
                </div>
                <div className="ms-auto flex flex-wrap items-center justify-end gap-1.5">
                  {d.outletIds.map((id) => (
                    <Badge key={id} tone="neutral">{outletName(id)}</Badge>
                  ))}
                  <Badge tone={statusTone(d.status)} dot>{statusLabel(d.status)}</Badge>
                  <DeleteButton label={labels.remove} onClick={() => removeDoctor(d.id)} />
                </div>
              </div>
            ))}

          {tab === "team" &&
            staff.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-panel)] bg-[var(--color-panel-muted)] p-4">
                <span className="flex size-10 items-center justify-center rounded-full bg-[var(--color-accent-surface)] text-[var(--color-primary)]">
                  <UserRound className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-text)]">{s.name}</p>
                  <p className="truncate text-sm text-[var(--color-text-muted)]">
                    {outletName(s.outletId)}{s.phone ? ` · ${s.phone}` : ""}{s.email ? ` · ${s.email}` : ""}
                  </p>
                </div>
                <Badge tone="primary" className="ms-auto">{roleOptions.find((r) => r.value === s.role)?.label ?? s.role}</Badge>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(s.loginEnabled)}
                  aria-label={labels.loginAccess}
                  onClick={() => toggleStaffLogin(s.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none transition-colors",
                    s.loginEnabled
                      ? "border-[color-mix(in_srgb,var(--color-success)_32%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)] text-[var(--color-success)]"
                      : "border-[var(--color-line)] bg-[var(--color-panel)] text-[var(--color-text-muted)]"
                  )}
                >
                  {s.loginEnabled ? <KeyRound className="size-3.5" /> : <KeyRound className="size-3.5 opacity-50" />}
                  {s.loginEnabled ? labels.loginActive : labels.loginNone}
                </button>
                <Badge tone={statusTone(s.status)} dot>{statusLabel(s.status)}</Badge>
                <DeleteButton label={labels.remove} onClick={() => removeStaff(s.id)} />
              </div>
            ))}

          {tab === "tests" && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-start text-sm">
                <thead className="text-[var(--color-text-muted)]">
                  <tr>
                    <th className="px-4 py-2 text-start font-medium">{labels.code}</th>
                    <th className="px-4 py-2 text-start font-medium">{labels.test}</th>
                    <th className="px-4 py-2 text-start font-medium">{labels.department}</th>
                    <th className="px-4 py-2 text-start font-medium">{labels.fee}</th>
                    <th className="px-4 py-2 text-start font-medium">{labels.offered}</th>
                    <th className="px-4 py-2 text-start font-medium">{labels.availability}</th>
                    <th className="px-4 py-2"><span className="sr-only">{labels.remove}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((row, i) => (
                    <tr key={row.code} className="bg-[var(--color-panel-muted)]">
                      <td className="rounded-s-[12px] px-4 py-2.5 font-mono text-xs">{row.code}</td>
                      <td className="px-4 py-2.5 font-medium text-[var(--color-text)]">{row.name}</td>
                      <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{row.department}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-2">
                          <span className="text-xs text-[var(--color-text-muted)]">{currency}</span>
                          <input
                            className="w-24 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-2 py-1 text-sm tabular-nums text-[var(--color-text)]"
                            inputMode="numeric"
                            value={row.fee}
                            onChange={(e) =>
                              setTests((list) => list.map((x, xi) => (xi === i ? { ...x, fee: Number(e.target.value) || 0 } : x)))
                            }
                          />
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.offered}
                          onClick={() => setTests((list) => list.map((x, xi) => (xi === i ? { ...x, offered: !x.offered } : x)))}
                          className={cn(
                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                            row.offered ? "bg-[var(--color-primary)]" : "bg-[color-mix(in_srgb,var(--color-text-muted)_40%,transparent)]"
                          )}
                        >
                          <span className={cn("inline-block size-3.5 rounded-full bg-[var(--color-panel)] transition-transform", row.offered ? "translate-x-[18px]" : "translate-x-1")} />
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          {activeOutlets.map((o) => {
                            const on = row.offered && row.outletIds.includes(o.id);
                            return (
                              <button
                                key={o.id}
                                type="button"
                                aria-pressed={on}
                                disabled={!row.offered}
                                onClick={() => toggleTestOutlet(i, o.id)}
                                className={cn(
                                  "rounded-full border px-2.5 py-1 text-xs font-medium leading-none transition-colors disabled:opacity-40",
                                  on
                                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                                    : "border-[var(--color-line)] bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                                )}
                              >
                                {o.name}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="rounded-e-[12px] px-4 py-2.5">
                        <DeleteButton label={labels.remove} onClick={() => removeTest(row.code)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                {labels.availabilityHint} · {formatMoney(tests.filter((t) => t.offered).reduce((s, t) => s + t.fee, 0), currency, intlLocale)} · {counts.tests}
              </p>
            </div>
          )}

          {tab === "schedule" && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-start text-sm">
                <thead className="text-[var(--color-text-muted)]">
                  <tr>
                    <th className="px-4 py-2 text-start font-medium">{labels.panelTitle}</th>
                    {dayColumns.map((d) => (
                      <th key={d.day} className="px-2 py-2 text-center font-medium">{d.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc) => (
                    <tr key={doc.id} className="bg-[var(--color-panel-muted)]">
                      <td className="rounded-s-[12px] px-4 py-2.5">
                        <p className="font-medium text-[var(--color-text)]">{doc.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{doc.specialty}</p>
                      </td>
                      {dayColumns.map((d, di) => {
                        const session = schedule[`${doc.id}:${d.day}`] ?? "off";
                        return (
                          <td key={d.day} className={cn("px-2 py-2.5 text-center", di === dayColumns.length - 1 && "rounded-e-[12px]")}>
                            <button
                              type="button"
                              onClick={() => cycleSession(doc.id, d.day)}
                              aria-label={`${doc.name} · ${d.label}`}
                              className={cn(
                                "min-h-8 w-full min-w-12 rounded-lg border px-2 text-xs font-semibold transition-colors",
                                sessionClass(session)
                              )}
                            >
                              {sessionLabel(session)}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "inventory" && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-start text-sm">
                <thead className="text-[var(--color-text-muted)]">
                  <tr>
                    <th className="px-4 py-2 text-start font-medium">{labels.reagentName}</th>
                    <th className="px-4 py-2 text-start font-medium">{labels.outlet}</th>
                    <th className="px-4 py-2 text-start font-medium">{labels.stock}</th>
                    <th className="px-4 py-2 text-start font-medium">{labels.unit}</th>
                    <th className="px-4 py-2 text-start font-medium">{labels.reorderLevel}</th>
                    <th className="px-4 py-2 text-start font-medium">{labels.status}</th>
                    <th className="px-4 py-2"><span className="sr-only">{labels.remove}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, i) => {
                    const status = reagentStatus(item);
                    return (
                      <tr key={item.id} className="bg-[var(--color-panel-muted)]">
                        <td className="rounded-s-[12px] px-4 py-2.5 font-medium text-[var(--color-text)]">{item.name}</td>
                        <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{outletName(item.outletId)}</td>
                        <td className="px-4 py-2.5">
                          <input
                            className="w-20 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-2 py-1 text-sm tabular-nums text-[var(--color-text)]"
                            inputMode="numeric"
                            value={item.stock}
                            onChange={(e) =>
                              setInventory((list) => list.map((x, xi) => (xi === i ? { ...x, stock: Number(e.target.value) || 0 } : x)))
                            }
                          />
                        </td>
                        <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{item.unit}</td>
                        <td className="px-4 py-2.5 tabular-nums text-[var(--color-text-muted)]">{item.reorderLevel}</td>
                        <td className="px-4 py-2.5">
                          <Badge tone={reagentTone[status]} dot>{reagentLabel[status]}</Badge>
                        </td>
                        <td className="rounded-e-[12px] px-4 py-2.5">
                          <DeleteButton label={labels.remove} onClick={() => removeReagent(item.id)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={micro}>{label}</span>
      {children}
    </label>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] hover:text-[var(--color-danger)]"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
