# AURA — Demo & Sales Walkthrough

A 10–15 minute script for showing AURA to a prospective laboratory owner or operations lead in Pakistan or the GCC. It is sequenced to land the differentiators first, then prove clinical rigour.

> Run `npm run dev:web` and demo on `http://localhost:3000`. All state is in-memory/file-backed demo data — register patients, move samples, take payments, and release reports freely; it resets cleanly.

---

## 0. Setup (before the call)

- Open these tabs:
  1. `http://localhost:3000/` (landing)
  2. `http://localhost:3000/ops?tenant=lumen&lang=en` (Lumen — Pakistan)
  3. `http://localhost:3000/ops?tenant=cedar&lang=en` (Cedar — UK/GCC styling)
  4. `http://localhost:3000/report/ord_lum_2?tenant=lumen` (branded report)
- Make sure light mode is on to start.

## 1. The pitch (landing page · 1 min)

Open `/`. One line: *"One platform runs your entire lab — booking, collection, the bench, validated reporting and billing — fully under your own brand, in English for Pakistan and Arabic for the GCC."*
- Toggle **dark mode** (top-right) — the whole site re-themes instantly.
- Switch language to **العربية** — the page flips to right-to-left with Arabic typography. This is the regional moat: most legacy LIS products have no real RTL. (English is the working language across Pakistan, so the platform stays English there.)

## 2. "It's your brand, not ours" (white-label · 3 min)

This is the core commercial message. Show it two ways:

1. **Two live brands, one engine.** Open the Lumen ops tab, then the Cedar ops tab. Same product, completely different identity (colour, type, density, report wording, currency PKR vs GBP). *"Each lab on the platform looks bespoke; we maintain one codebase."*
2. **Live configurator.** Go to `/admin?tenant=lumen`. Change the **primary colour**, **canvas**, **corner radius**, and toggle **feature flags / clinical policies**. The live preview re-themes instantly. *"Onboarding a new franchise or white-label partner is configuration, not development."*

## 3. The clinical workflow with guardrails (`/ops/actions` · 4 min)

Open `/ops/actions?tenant=lumen`. This is the operational heart — walk the full lifecycle:
- **Register** a patient → it creates the order, sample (barcode), and invoice in one step.
- **Move the sample** through its states (collected → in transit → received → processing → completed → verified). Only the *allowed* transitions for each role are offered — the state machine is enforced.
- **Record a payment** against the invoice.
- **Try to release a report with an open critical alert** — it is blocked. *"AURA will not let an unvalidated result or an unacknowledged critical reach a patient."*
- **Acknowledge the critical alert**, then **validate** the result, then **release**. Point out the **audit trail** updating live — every change is stamped with who/when/before/after.

Reinforce: *"AI can summarise and explain, but a pathologist always signs off. That's ISO 15189-aligned and audit-safe."*

## 4. The deliverable patients actually see (report · 2 min)

Open `/report/ord_lum_2?tenant=lumen`.
- A clean, branded, accredited-style report: demographics, results with **High/Low/Critical flags**, interpretation, and (if enabled for the tenant) a plain-language **AI patient summary** with a safety disclaimer.
- The **QR code is real and scannable** — scan it with a phone; it encodes the verification URL. *"Generated locally — no patient data leaves your servers to a QR API."*
- Hit **Print** — it renders as a clean A4 PDF (toolbar and chrome drop away).
- Switch `?lang=ar` to show the report localized and right-to-left.

## 5. Run the business (insights & catalog · 2 min)

- `/ops/insights?tenant=lumen` — revenue trend, turnaround time vs target, volume by department, sample-status mix, and a **Levey-Jennings QC chart** with ±2SD/±3SD limits. *"Branch managers get this without a separate BI tool."*
- `/ops/catalog?tenant=lumen` — searchable test catalog with panels, specimens, reference ranges, TAT and **multi-currency pricing** (PKR / SAR / AED / GBP / USD).

## 6. Close

- *"Same platform, your brand, your language, your currency, your fee schedule — live in weeks."*
- Point to the [roadmap](../README.md#roadmap): payments (JazzCash/Easypaisa/GCC), analyzer HL7/ASTM, inventory, full QA/QC, and the mobile apps are the next milestones.

---

## Demo data cheat-sheet

| Tenant | Slug | Currency | Locale | Notable order |
|--------|------|----------|--------|---------------|
| Lumen Diagnostics | `lumen` | PKR | en-PK | `ord_lum_2` — HbA1c 9.1% (critical), draft report `RPT-LUM-4401` |
| Cedar PathLab | `cedar` | GBP | en-GB | `ord_ced_1` — Lipid Profile + LFT, registered |

Useful query params on any page: `?tenant=lumen|cedar`, `?lang=en|ar`, `?role=receptionist|phlebotomist|technician|pathologist|branch_manager|super_admin`.
