export const meta = {
  name: 'aura-feature-surfaces',
  description: 'Build 6 polished, localized, dark-mode-ready product surfaces for the AURA diagnostic platform',
  phases: [{ title: 'Surfaces', detail: 'landing, insights, catalog, report, configurator, login — one agent each' }]
}

const CONTRACT = `
PROJECT: "AURA" — a world-class, white-label diagnostic lab (LIMS) platform. Monorepo, workspace @lab/web at apps/web. Stack: Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS v4. Target markets: Pakistan + GCC. Must look like a premium, modern SaaS product — NOT generic AI output.

ABSOLUTE RULES:
- Create ONLY the files listed in your task. Do NOT edit any existing file unless your task explicitly says to replace it. Never touch: dictionaries (lib/i18n/dictionaries/*), shells (components/ops-shell.tsx, patient-shell.tsx), globals.css, layout.tsx, package.json, tsconfig, or files owned by other agents.
- Do NOT run npm/yarn/build/typecheck/install/git. Just write correct TypeScript/TSX. The orchestrator verifies & integrates.
- COLORS: use ONLY CSS variables via Tailwind arbitrary values. Never hardcode hex (except the report agent's print PDF needs, and even then prefer tokens). Available tokens:
  text: text-[var(--color-text)] text-[var(--color-text-muted)]
  surfaces: bg-[var(--color-canvas)] bg-[var(--color-panel)] bg-[var(--color-panel-muted)] bg-[var(--color-accent-surface)]
  brand: bg-[var(--color-primary)] text-[var(--color-primary)] text-[var(--color-primary-foreground)]
  semantic: var(--color-success) var(--color-warning) var(--color-danger)
  borders: border-[var(--color-line)] ; radius: rounded-[var(--radius-panel)] ; headings: font-[var(--font-display)]
  shadows: className "shadow-card" and "shadow-lift" (already defined). bg helpers: "bg-aura" "bg-grid" "text-gradient" "animate-rise".
  color-mix is allowed e.g. bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)].
- DARK MODE is automatic via tokens — never assume light. Numbers use "tabular-nums".
- RTL: pages render inside dir-aware wrappers. Use LOGICAL Tailwind utilities only where direction matters: gap, ms-/me-, ps-/pe-, text-start/text-end, start-/end-. Do NOT use ml-/mr-/text-left/text-right/left-/right- for directional layout.
- ACCESSIBILITY: semantic html, aria-labels on icon-only buttons, min touch target ~44px, focus-visible relies on global styles.

FOUNDATION APIS (import with the EXACT relative prefix given in your task; packages use @lab/*):
- i18n: import { getTranslator, getLocalization, localeMeta, locales, directionOf, type Locale } from "<PREFIX>/lib/i18n"
    getLocalization(rawLang) => { locale, dir, intlLocale, t }.  t("a.b.c", { var: val }) => string. Missing keys fall back to English then the key.
- session: import { getAppContext } from "<PREFIX>/lib/session"
    getAppContext(searchParams, { defaultRole }) => { tenant, role, actor, locale, dir, intlLocale, t }.
- url: import { withParams, pickParam } from "<PREFIX>/lib/url" ; withParams("/ops", { tenant, lang, role }) builds a query string dropping empties. pickParam(sp, "lang").
- data: import { getTenantDomainData, getOrderReport } from "<PREFIX>/lib/domain"
    getTenantDomainData(tenant) => { snapshot, patientActor, receptionistActor, phlebotomistActor, technicianActor, pathologistActor }.
- format: import { formatMoney, formatNumber, formatDateTime, formatDate } from "<PREFIX>/lib/format"
    formatMoney(amount, currency, intlLocale); formatDateTime(iso, intlLocale, timeZone?) => string|undefined (use ?? t("common.pending")).
- status: import { sampleStatusTone, sampleStatusLabel, resultStatusTone, resultStatusLabel, invoiceStatusTone, invoiceStatusLabel, reportStatusTone, reportStatusLabel } from "<PREFIX>/lib/status" ; tone(status) => BadgeTone, label(status, t) => string.
- UI: import { Card, Button, Badge, SectionHeading, AppShell, cn } from "@lab/ui"
    Badge tone: "neutral"|"primary"|"success"|"warning"|"danger"|"info", optional dot boolean.
    Button tone: "primary"|"secondary"|"ghost"|"danger", size: "sm"|"md"|"lg".
    Card props: interactive?:boolean (hover lift), flat?:boolean (no shadow). SectionHeading props: eyebrow?, align?.
- icons: import { ... } from "lucide-react" (size via className "size-5" etc).
- contracts types: import type { TenantConfig, TenantSnapshot, PatientRecord, OrderRecord, SampleRecord, ResultRecord, InvoiceRecord, ReportRecord, CriticalAlertRecord, UserRole } from "@lab/contracts".
- catalog: import { testCatalog, findTest } from "@lab/demo-data" ; import type { CatalogTest, CatalogDepartment, CatalogCurrency, TestCatalog } from "@lab/contracts".
    CatalogTest = { code, name, department, specimen, method?, loinc?, referenceRange, unit?, tatHours, prices: Partial<Record<CatalogCurrency, number>>, isPanel?, panelTests?, popular? }. testCatalog.tests, testCatalog.currencies.
- tenant theme wrapper: import { TenantTheme } from "<PREFIX>/components/tenant-theme" ; <TenantTheme tenant={tenant} locale={locale}>...</TenantTheme> sets data-tenant + lang + dir + brand tokens.
- OpsShell: import { OpsShell } from "<PREFIX>/components/ops-shell" ; props { tenant, actor, snapshot, active, locale }. active in: "dashboard"|"insights"|"patients"|"orders"|"catalog"|"reports"|"actions"|"admin". Already wraps content in TenantTheme + renders nav + theme/language/role controls. Put your content as children.
- QR: import { QrCode } from "<PREFIX>/components/qr-code" ; <QrCode value="https://..." size={132} /> renders a scannable inline SVG QR (no network).
- controls (client): import { ThemeToggle } from "<PREFIX>/components/controls/theme-toggle"; import { LanguageSwitcher } from "<PREFIX>/components/controls/language-switcher"; (LanguageSwitcher needs prop current:Locale).

DATA SHAPES (snapshot from getTenantDomainData):
  patients: { id, mrn, fullName, phone, nationalId, dateOfBirth, sex, ... }
  orders: { id, patientId, appointmentId, orderNumber, tests: string[], status: "registered"|"in_progress"|"awaiting_release"|"released", branchName, homeCollection, createdAt, updatedAt }
  samples: { id, orderId, barcode, specimen, status, collectedAt?, lastCheckpoint, ... }
  results: { id, orderId, sampleId, testName, status, value, referenceRange, abnormal, critical, validatorName?, ... }
  invoices: { id, orderId, invoiceNumber, status, totalAmount, paidAmount, currency, ... }
  reports: { id, orderId, reportNumber, status: "draft"|"released"|"amended", releasedAt?, releasedBy?, amendmentNote?, ... }
  appointments: { id, patientId, status, channel, scheduledAt, branchName, ... }
  criticalAlerts: { id, resultId, patientId, status, acknowledgedBy?, acknowledgedAt? }
  auditLogs: { id, actorName, actorRole, entityType, entityId, action, createdAt }
  Two demo tenants: slug "lumen" (PKR, Asia/Karachi) and "cedar" (GBP, Europe/London). Default tenant: lumen.

NEXT 15 PAGE SIGNATURE:
  export default async function Page({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = searchParams ? await searchParams : undefined;
    const { tenant, snapshot... } = getAppContext(sp, { defaultRole: "..." });
  }
  Dynamic routes also receive params: { params }: { params: Promise<{ orderId: string }> } — await it.
  Client components: add "use client" first line; may use next/navigation hooks. Server components must NOT use hooks.

QUALITY BAR: premium spacing, clear hierarchy, font-[var(--font-display)] for headings, micro-labels in uppercase tracking-wide text-[var(--color-text-muted)], semantic Badges for statuses, "shadow-card" panels, hover states on interactive items, empty states handled. Return ONLY a short summary of files you created (paths) and anything the orchestrator must wire up. Do not include code in your final message.
`;

const agents = [
  {
    label: 'landing',
    prompt: `${CONTRACT}

YOUR TASK — WORLD-CLASS MARKETING LANDING PAGE (brand-neutral, uses default AURA tokens).
REPLACE the file: apps/web/app/page.tsx  (import prefix for this file is "../lib" and "../components"; packages "@lab/...").
You MAY also create marketing section components under apps/web/components/marketing/*.tsx (for those, lib prefix "../../lib", components prefix "..", packages "@lab/...").

This is a server component page. Read the language from searchParams: const sp = await searchParams; const { t, locale, dir, intlLocale } = getLocalization(pickParam(sp, "lang")). Wrap the WHOLE page in a root element with lang={locale} dir={dir} so RTL works, e.g. <div lang={locale} dir={dir} className="min-h-dvh bg-[var(--color-canvas)] text-[var(--color-text)]">.

Build a premium, conversion-focused landing page with these sections (use existing dictionary keys under landing.*, common.*, nav.* — examples: t("landing.heroTitle"), t("landing.heroSubtitle"), t("landing.ctaPrimary"), t("landing.ctaSecondary"), t("landing.featuresTitle"), t("landing.feature.brandedTitle")/brandedBody/workflowTitle/workflowBody/multilingualTitle/multilingualBody/auditTitle/auditBody/analyticsTitle/analyticsBody/mobileTitle/mobileBody, t("landing.modulesTitle"), t("landing.modulesList.registration") ... (registration,booking,samples,lis,analyzers,reporting,billing,inventory,qc,ai,franchise,notifications), t("landing.whiteLabelTitle")/whiteLabelBody, t("landing.marketsTitle"), t("landing.ctaBannerTitle")/ctaBannerBody, t("landing.statLabs")/statUptime/statLangs/statCompliance, t("landing.trustedBy"), t("landing.eyebrow")):
1) Sticky top nav bar: AURA wordmark (t("brand.platform")) + a language switcher (<LanguageSwitcher current={locale} />) + theme toggle (<ThemeToggle />) + a "Sign in" link (t("nav.login")) to withParams("/login", { lang: locale }) and a primary "Book a demo" Button (t("common.bookDemo")). The switchers ARE client components already, so the nav can be a server component rendering them.
2) Hero: big font-[var(--font-display)] headline using text-gradient on part, subheadline, two CTAs — primary -> withParams("/login", { lang: locale }), secondary -> withParams("/ops", { tenant: "lumen", lang: locale }). Add the "animate-rise" class. Use a "bg-aura" decorative background and/or "bg-grid". Include a small trust line t("landing.trustedBy").
3) Stats strip: 4 stats (statLabs, statUptime, statLangs, statCompliance) in tabular-nums.
4) Features grid: 6 cards (the landing.feature.* pairs) each with a lucide icon (Palette, ShieldCheck, Languages, FileCheck2, LineChart, Smartphone), title, body. Use Card interactive.
5) Modules section: a grid/bento of the 12 module names (landing.modulesList.*) as tidy chips/cards with small icons.
6) White-label section: headline + body + a row of 3 mini brand "preview" chips showing different colored brand dots/cards (use inline style backgroundColor with a few hardcoded brand swatch hexes is OK here ONLY for the swatches, e.g. #0e7c66, #1f3f73, #b4530a) to convey multi-brand. Include a "See it as Lumen / Cedar" pair of links to /ops?tenant=lumen and /ops?tenant=cedar with lang preserved.
7) Markets section: Pakistan + GCC (KSA, UAE, Qatar) positioning with a couple of bullet points (Urdu+Arabic, local payments JazzCash/Easypaisa + GCC gateways, data residency, ISO 15189). You can hardcode short English bullet specifics not in the dictionary.
8) CTA banner: ctaBannerTitle + ctaBannerBody + primary Button to /login.
9) Footer: brand, tagline (t("brand.tagline")), copyright, small nav links.

Make it genuinely beautiful and distinctive (asymmetry, generous whitespace, layered backgrounds, refined type scale). Ensure it looks great in both light and dark and in RTL.`
  },
  {
    label: 'insights',
    prompt: `${CONTRACT}

YOUR TASK — OPERATIONS ANALYTICS / INSIGHTS DASHBOARD with hand-built SVG charts.
CREATE: apps/web/app/ops/insights/page.tsx (import prefix "../../../lib" and "../../../components"; packages "@lab/...").
ALSO CREATE reusable chart components under apps/web/components/charts/*.tsx (for those: lib prefix "../../lib", packages "@lab/..."). Build: AreaLineChart (revenue trend), BarChart (volume by department), DonutChart or StackedBar (sample status mix), LeveyJenningsChart (QC scatter with mean/±2SD/±3SD lines). All charts are pure inline SVG, responsive (viewBox + width 100%), and use CSS variable colors (e.g. fill/stroke "var(--color-primary)", "var(--color-success)", grid lines "var(--color-line)", text "var(--color-text-muted)"). Charts must be server-renderable (no client hooks, no animation libs). Keep them simple, correct, and elegant.

The page is a server component. Use getAppContext(sp, { defaultRole: "branch_manager" }) to get { tenant, actor, snapshot, locale, intlLocale, t }. Render inside <OpsShell active="insights" tenant={tenant} actor={actor} snapshot={snapshot} locale={locale}> ... </OpsShell>.

Derive real numbers from snapshot where possible (collected revenue = sum invoices.paidAmount; billed = sum totalAmount; outstanding = total-paid; active samples; open criticals; counts by status) and SUPPLEMENT with plausible DETERMINISTIC demo time-series (fixed hardcoded arrays — do NOT use randomness or current-time APIs) so charts look rich. Currency from the first invoice or tenant (lumen=PKR, cedar=GBP). Use formatMoney(amount, currency, intlLocale) and formatNumber.

Layout:
- A row of 4 KPI cards: t("ops.dashboard.revenueToday") (collected), t("insights.avgOrderValue"), t("insights.tat") (e.g. "6.2 h" with target), t("insights.rejectionRate"). Each card: micro-label, big tabular-nums value, a tiny delta/trend hint, lucide icon.
- Revenue trend area+line chart (t("insights.revenue")) full width or 2/3, with collected vs billed legend.
- Two-up: Volume by department bar chart (t("insights.volumeByDept"), use dept names from t("catalog.departments.*")) and Sample status mix donut (t("insights.statusMix")) with a legend of statuses (use sampleStatusLabel + sampleStatusTone for colors — map tone to a token color).
- QC Levey-Jennings chart (t("insights.qcTitle"), subtitle t("insights.qcSubtitle")) — scatter of ~16 daily control points around a mean with horizontal lines at mean, ±2SD, ±3SD; points outside ±2SD highlighted in warning/danger color.
Use Card + SectionHeading. Beautiful, dense-but-legible, dark-mode + RTL safe.`
  },
  {
    label: 'catalog',
    prompt: `${CONTRACT}

YOUR TASK — TEST CATALOG (ops surface) with search + departments + multi-currency pricing.
CREATE: apps/web/app/ops/catalog/page.tsx (import prefix "../../../lib" and "../../../components"; packages "@lab/...").
ALSO CREATE a client search/filter component apps/web/components/catalog/catalog-browser.tsx (lib prefix "../../lib", packages "@lab/..."; add "use client").

Page (server component): getAppContext(sp, { defaultRole: "receptionist" }) => { tenant, actor, snapshot, locale, intlLocale, t }. Render inside <OpsShell active="catalog" tenant={tenant} actor={actor} snapshot={snapshot} locale={locale}>.
Pass testCatalog.tests and the tenant currency (lumen->PKR, cedar->GBP; you can also show a currency toggle among testCatalog.currencies) and intlLocale + a dictionary of translated department names (build an object mapping each CatalogDepartment to t("catalog.departments.<dept>")) into the client CatalogBrowser as props (plain serializable data + the translated strings — do NOT pass the t function to the client; resolve all labels on the server and pass strings).

CatalogBrowser (client):
- A search input (filter by name/code/department) and department filter chips and a currency selector (the currencies the catalog supports).
- Group tests by department; show each test as a row/card: code (mono/badge), name, specimen, method, reference range, TAT ("{n} h"), price (import formatMoney from "../../lib/format" which is safe in client too and call formatMoney(price, currency, intlLocale)). Mark panels with a Badge tone="primary" t("catalog.panel") and list included member codes (t("catalog.panelIncludes")). Mark popular tests with a Badge.
- Use labels via passed-in strings; column headers from passed props (t("catalog.code"/test/specimen/referenceRange/tat/price/method/department), searchPlaceholder t("catalog.searchPlaceholder")).
Polished table/cards, sticky-ish header, empty state when no matches. Dark + RTL safe (logical utilities). Keep it fast and clean.`
  },
  {
    label: 'report',
    prompt: `${CONTRACT}

YOUR TASK — PRINT / PDF-READY BRANDED LABORATORY REPORT with QR verification.
CREATE: apps/web/app/report/[orderId]/page.tsx (import prefix "../../../lib" and "../../../components"; packages "@lab/...").
ALSO CREATE: apps/web/components/report/print-button.tsx (client, calls window.print(); lib prefix "../../lib"), and optionally apps/web/components/report/report-document.tsx (server) for the report layout.

Page is a server component with BOTH params and searchParams (Next 15 — await both):
  export default async function Page({ params, searchParams }: { params: Promise<{ orderId: string }>, searchParams?: Promise<Record<string,string|string[]|undefined>> })
Resolve { tenant, locale, intlLocale, t } via getAppContext(sp). Get { snapshot } = getTenantDomainData(tenant). Find the order by params.orderId; if not found, fall back to the first order that has a report or results (so the demo always renders something). Gather: patient (snapshot.patients by order.patientId), the order's results (snapshot.results filter orderId), sample(s), report (getOrderReport(snapshot, order.id)), referring/validator info.

Wrap everything in <TenantTheme tenant={tenant} locale={locale}> so it is branded + dir-aware. The outer page background bg-[var(--color-canvas)] with a centered A4-like white sheet: a Card/div with className "print-page" max-w-[820px] mx-auto bg-[var(--color-panel)] shadow-lift p-8 sm:p-12.
Include a top toolbar with className "no-print" containing a back link and a <PrintButton label={t("report.print")} /> (and you may add a theme/language control). The toolbar must NOT print.

Report document layout (clinical, premium, like a real pathology report):
- Header: brand block (tenant.logos.square in a colored tile + tenant.brandName + tenant.reportTemplate.headerLabel) on the start side; on the end side a verification panel with <QrCode value={verifyUrl} size={120} /> where verifyUrl = "https://verify." + tenant.slug + ".aura.health/r/" + report.reportNumber (or order.orderNumber), plus t("report.scanToVerify"), t("report.verificationCode") + a code (derive a short uppercase code from reportNumber), and t("report.verifyAt") + the domain. Show a Badge tone="success" dot with t("report.verified") if report?.status === "released".
- Patient demographics grid: t("report.reportNo"), t("report.orderNo"), t("report.mrn"), t("report.patient") (fullName), t("report.age") (compute age from dateOfBirth + sex), t("report.referredBy") (use "Self / Walk-in" or order.branchName), t("report.collected") (sample.collectedAt via formatDateTime), t("report.reported") (report.releasedAt via formatDateTime, else show t("common.pending")). Use a clean 2-3 column key/value layout with hairline borders.
- Results table: columns t("report.test"), t("report.result") (value), t("report.unit") (parse from value if present, else blank), t("report.referenceRange"), t("report.flag"). For each result compute a flag: if result.critical -> Badge danger t("report.criticalFlag"); else if result.abnormal -> Badge warning t("report.high")/t("report.low") (you can show t("report.high") generically or infer); else Badge neutral t("report.normal"). Abnormal/critical rows subtly emphasized. If no results, show a friendly note.
- Interpretation block (t("report.interpretation")): a short clinical note (use result context; you may hardcode a brief sensible English interpretation).
- AI patient summary (t("report.aiSummary")): ONLY if tenant.features.aiPatientExplanation — a short plain-language summary in a tinted Card with t("report.aiDisclaimer") footnote.
- Footer: t("report.validatedBy") + validatorName (or report.releasedBy) with a signature-style line; t("report.confidential"); tenant.reportTemplate.footerNote; centered t("report.endOfReport").
Make print output clean (the @media print rules and .print-page/.no-print classes already exist globally). RTL + dark safe. This is the money shot of the demo — make it look like a real, beautiful accredited lab report.`
  },
  {
    label: 'configurator',
    prompt: `${CONTRACT}

YOUR TASK — SUPER-ADMIN WHITE-LABEL LIVE CONFIGURATOR.
REPLACE the file: apps/web/app/admin/page.tsx (import prefix "../../lib" and "../../components"; packages "@lab/...").
ALSO CREATE: apps/web/components/admin/configurator.tsx (client; lib prefix "../../lib", components "..", packages "@lab/...").

Page (server): getAppContext(sp, { defaultRole: "super_admin" }) => { tenant, actor, snapshot, locale, t, intlLocale }. Render inside <OpsShell active="admin" tenant={tenant} actor={actor} snapshot={snapshot} locale={locale}>. Pass to the client <Configurator> serializable props ONLY: the tenant object (tenant), and a bundle of translated labels (resolve every t(...) you need on the server into a plain object, because the client cannot call t). Also pass snapshot.auditLogs (sliced to ~8) and the tenant.notifications + tenant.features + tenant.policies.

Configurator (client component, "use client"): a live white-label editor with a split layout — controls on the start side, a LIVE PREVIEW on the end side.
- Controls: brand name text input; primary color input type="color"; canvas/background color input; corner radius slider (e.g. 6–28px); density select (comfortable/compact); feature flag toggles (from tenant.features keys: onlineBooking, homeCollection, payments, aiPatientExplanation, aiResultSummary, phlebotomyApp); policy toggles (allowCreditBilling, requireOtpForReports, requirePathologistApproval, enableCriticalCallLogging). Keep all edits in React state.
- LIVE PREVIEW: a container whose inline style sets the CSS variables from current state, e.g. style={{ ['--color-primary' as any]: primary, ['--color-canvas' as any]: canvas, ['--radius-panel' as any]: radius + 'px' }}. Inside, render mini mock components that read those vars: a sample report header tile, a couple of Badges, primary/secondary Buttons, a patient card, a mock invoice line. The preview updates instantly as controls change. Add a note (passed label) that "changes re-theme the platform instantly" and an "Apply brand" button (no real persistence — show a small confirmation inline message that this is a demo).
- Below or beside: a feature & policy matrix summary, the notification templates (show emailFromName/smsSender/whatsappSender and a couple of template subjects/bodies read-only), domains list, default locale, and an audit log table (auditLogs: action, entityType/entityId, actorName/actorRole, createdAt — render the createdAt string as-is, or format it client-side with the Intl date API).
Use Card, SectionHeading, Badge, Button. Premium, organized, dark + RTL safe. Use passed-in translated labels (admin.* keys: title, subtitle, identity, brandName, palette, primary, canvas, radius, preview, features, policies, notifications, audit, domains, locale, featureMatrix, livePreviewNote, applyBrand; plus common.enabled/disabled/save).`
  },
  {
    label: 'login',
    prompt: `${CONTRACT}

YOUR TASK — POLISHED SIGN-IN / WORKSPACE SELECTOR (demo auth).
CREATE: apps/web/app/login/page.tsx (import prefix "../../lib" and "../../components"; packages "@lab/...").
ALSO CREATE: apps/web/components/auth/login-form.tsx (client; lib prefix "../../lib", components "..", packages "@lab/...").

Page (server): const sp = await searchParams; const { t, locale, dir, intlLocale } = getLocalization(pickParam(sp, "lang")). Brand-neutral default tokens. Wrap in <div lang={locale} dir={dir} className="min-h-dvh ...">. Build a premium split-screen:
- Brand panel (one side, hidden on small screens): bg-aura / gradient, AURA wordmark (t("brand.platform")) + tagline (t("brand.tagline")), a few value-prop bullets (use landing.feature.* titles or short English), trust line (t("landing.trustedBy")).
- Form panel: a Card with t("login.title", { brand: t("brand.platform") }), t("login.subtitle"), and the <LoginForm> client component.
Pass to LoginForm: locale, and translated labels (selectBrand, selectRole, selectLanguage, continue, demoNote, asPatient, asStaff from login.*, plus role labels: build an array of { value, label } for staff roles receptionist/phlebotomist/technician/pathologist/branch_manager/super_admin using t("roles.<role>"), and brand options [{ value:"lumen", label:"Lumen Diagnostics" }, { value:"cedar", label:"Cedar PathLab" }]).

LoginForm (client, "use client"): uses useRouter from next/navigation.
- Inputs: brand select, role select, language segmented buttons (or reuse passed locale list).
- Two actions: "Enter platform" / "Continue as staff" -> router.push(withParams("/ops", { tenant: brand, role, lang })); "Continue as patient" -> router.push(withParams("/patient", { tenant: brand, lang })). Import { withParams } from "../../lib/url".
- Show t("login.demoNote") as a subtle note (no password field needed; you may show a disabled/optional email field prefilled "demo@aura.health" for realism but it's not required to submit).
Beautiful, modern auth screen. Dark + RTL safe. Add a small theme toggle (import ThemeToggle) and a back-to-home link.`
  }
]

phase('Surfaces')
const results = await parallel(
  agents.map((a) => () => agent(a.prompt, { label: a.label, phase: 'Surfaces' }))
)

return agents.map((a, i) => ({ surface: a.label, summary: results[i] }))
