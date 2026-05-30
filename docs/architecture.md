# Architecture Overview

## Decision set

- Frontend web: Next.js + TypeScript + Tailwind CSS
- Mobile: React Native with Expo + TypeScript
- Backend: NestJS + PostgreSQL + Redis + RabbitMQ + object storage
- Topology: modular monolith with explicit domain module boundaries
- Tenancy: shared application with tenant-scoped auth, configuration, storage, and audit records

## Product surfaces

- Patient web app for booking, reports, payments, notifications, and AI explanations
- Operations web app for receptionist, technician, pathologist, branch manager, and super admin flows
- Patient mobile app for booking and report access
- Phlebotomist mobile app for assignment execution and offline collection

## Core module boundaries

- `auth`: identity, sessions, roles, tenant claims
- `tenants`: theme config, domains, feature flags, branding assets
- `patients`: demographics, duplicate detection, consent, family linkage
- `orders`: appointments, orders, schedules, route assignments
- `samples`: barcode tracking, chain of custody, rejection and recollection
- `results`: result entry, validation, release, amendments, critical alerts
- `billing`: invoices, payments, discounts, corporate accounts
- `reporting`: report rendering, delivery channels, patient-facing access
- `notifications`: email, SMS, WhatsApp, push, in-app notices
- `inventory`: reagent batches, expiry, purchase orders, QC-linked stock
- `quality`: QC runs, calibration logs, CAPA, Westgard rules
- `ai`: draft assistance, explanation, and policy enforcement

## Non-negotiable constraints

- Every core record carries `tenantId`
- Every result-affecting action is auditable
- Released reports are amended, not overwritten
- AI can draft, explain, or flag, but cannot autonomously release
- Mobile collection workflows must survive offline operation and reconciliation
