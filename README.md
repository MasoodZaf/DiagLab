# AURA — White-label Diagnostic Lab Platform

A modern, AI-native, **white-label diagnostic laboratory platform (LIS/LIMS)** built for **Pakistan and the GCC**. One hardened clinical core; every lab gets its own brand, colours, report styling, domains, languages, and patient communication — no forks, no custom builds.

> Status: a working, demoable product foundation with a full vertical slice (registration → collection → bench → validation → release → branded report → billing) plus marketing, analytics, catalog, white-label configurator, and a bilingual (English / العربية) RTL-aware UI with light + dark themes. English is the working language for Pakistan; Arabic (RTL) serves the GCC. See [Roadmap](#roadmap) for what is production-ready vs. in progress.

---

## Highlights

- **White-label by design** — per-tenant brand tokens (colour, type, radius, density), report styling, notification templates, feature flags and clinical policies. Brand + dark palette are derived and injected per tenant; the entire UI re-themes from CSS variables.
- **Bilingual + RTL-native** — English (the working language across Pakistan) and Arabic with full right-to-left layouts for the GCC, plus locale-aware number/date/currency formatting.
- **Light & dark mode** — no-flash theme switching; per-tenant dark palettes derived automatically from the brand colour.
- **Guardrailed clinical workflow** — barcode-to-release sample states, pathologist sign-off, critical-alert acknowledgement gating, immutable release logs, and a full audit trail. Enforced in a shared workflow engine ([`apps/web/lib/server/workflow-store.ts`](apps/web/lib/server/workflow-store.ts), [`apps/api`](apps/api)).
- **Operations intelligence** — revenue, turnaround, volume and QC (Levey-Jennings) dashboards built from live data, all hand-rendered SVG (no chart deps).
- **Branded, print/PDF-ready reports** — clinical report layout with flags, interpretation, optional AI summary, and a **real, scannable QR verification code** generated locally (no third-party calls).
- **Test catalog** — departments, panels, specimens, reference ranges, TAT and multi-currency pricing (PKR / SAR / AED / GBP / USD).

## Workspace

| Path | Description |
|------|-------------|
| `apps/web` | Next.js 15 (App Router, React 19) — patient, operations, marketing, report & admin surfaces |
| `apps/api` | NestJS API: dual-mode (in-memory / PostgreSQL) workflow engine with audit trails & RBAC |
| `apps/mobile` | Expo shell for patient & phlebotomist apps (architecture preview) |
| `packages/contracts` | Shared domain + tenancy + catalog contracts (roles, workflow rules, types) |
| `packages/branding` | Theme tokens, per-tenant presets, dark-palette derivation, notification templates |
| `packages/ui` | Shared UI primitives (AppShell, Button, Card, Badge, SectionHeading) |
| `packages/demo-data` | Seed tenants, snapshots and the test catalog |
| `infra/postgres` | Schema, seed and docker-compose for PostgreSQL |
| `docs` | Architecture, workflows, white-label, database, testing, API, demo guide |

## Web surfaces

| Route | Surface |
|-------|---------|
| `/` | Marketing landing page (brand-neutral "AURA") |
| `/login` | Workspace + role selector (demo auth) |
| `/ops` | Operations dashboard (live KPIs, queues, recent activity) |
| `/ops/insights` | Analytics: revenue / TAT / volume / QC charts |
| `/ops/catalog` | Test catalog with search, departments & multi-currency pricing |
| `/ops/orders`, `/ops/patients`, `/ops/reports` | Operational registries with detail views |
| `/ops/actions` | Interactive workflow action center (intake → release) |
| `/admin` | Super-admin **white-label live configurator** |
| `/patient`, `/patient/orders` | Patient portal (tracking, reports, payments) |
| `/report/[orderId]` | Branded, print/PDF-ready laboratory report with QR verification |

Every surface accepts `?tenant=lumen|cedar`, `?lang=en|ar`, and (ops) `?role=…` query parameters. Theme (light/dark) is toggled in-app and persisted.

## Quick start

```sh
npm install
npm run dev:web      # http://localhost:3000
```

Then open:

- `http://localhost:3000/` — landing
- `http://localhost:3000/ops?tenant=lumen&lang=en` — Lumen (Pakistan) operations
- `http://localhost:3000/ops?tenant=cedar&lang=en` — Cedar (UK) operations
- `http://localhost:3000/?lang=ar` — Arabic, right-to-left
- `http://localhost:3000/report/ord_lum_2?tenant=lumen` — branded report + QR

Optional API + database:

```sh
npm run dev:api      # NestJS on :4000 (in-memory by default)
npm run db:up        # PostgreSQL via docker compose
# set WORKFLOW_REPOSITORY_MODE=postgres for the API to use the database
```

## Verification

```sh
npm run typecheck                 # all workspaces
npm test                          # api + branding unit tests, web/mobile typecheck gates
npm run build --workspace @lab/web
```

## Design principles

- Shared application logic; tenant-scoped branding, language, and configuration.
- Product-owned layouts; tenant-owned tokens, copy, and policy.
- Auditability and safe, role-gated workflow transitions as core invariants.
- AI assists — it never auto-releases a clinical report.

## Roadmap

**Working today:** white-label theming + dark mode, EN/UR/AR + RTL, the clinical workflow engine with audit/guardrails (web + API), analytics, test catalog, branded report + QR, demo auth, PostgreSQL schema & dual-mode API.

**Next for production:** real authentication (JWT/MFA) + session RBAC enforcement, payment gateways (JazzCash / Easypaisa / GCC / Stripe), analyzer integration (HL7/ASTM), inventory & full QA/QC modules, functional mobile apps, and notification provider wiring (WhatsApp/SMS/email). See [`ai_diagnostic_lab_platform_prd_and_codex_skills.md`](ai_diagnostic_lab_platform_prd_and_codex_skills.md) for the full product spec and [`docs/demo-guide.md`](docs/demo-guide.md) for a sales walkthrough.
