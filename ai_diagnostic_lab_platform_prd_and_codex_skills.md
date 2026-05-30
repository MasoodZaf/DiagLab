# AI-Powered Diagnostic Laboratory Platform
## Product Requirements Document (PRD)

Version: 1.0  
Target Markets: Pakistan, GCC, UK (Future)  
Product Type: Multi-tenant SaaS Diagnostic Laboratory Information Platform  
Primary Audience: Diagnostic laboratories, collection centers, pathology groups, franchise laboratories

---

# 1. Executive Summary

This platform is a cloud-native AI-powered Diagnostic Laboratory Management System (LIS/LIMS) designed for laboratories similar to Chughtai Lab and IDC Pakistan.

The system shall support:

- Patient registration
- Home sample collection
- Barcode-based sample tracking
- Laboratory workflows
- Analyzer integrations
- Result validation
- PDF report generation
- WhatsApp report delivery
- Franchise/branch operations
- AI-assisted diagnostics and operations
- Mobile applications
- QA/QC compliance workflows
- Multi-tenant SaaS architecture

The product must be:

- Scalable
- Secure
- Multi-branch capable
- Mobile-first
- AI-enabled
- API-first
- Dockerized
- Cloud-native
- Auditable
- ISO 15189-ready

---

# 2. Objectives

## Business Objectives

- Build modern SaaS LIS platform for Pakistan and GCC
- Replace legacy desktop-based LIS systems
- Enable AI-assisted laboratory operations
- Support centralized + franchise lab operations
- Provide superior UX/UI
- Enable rapid scaling

## Technical Objectives

- Modular architecture
- High availability
- Secure PHI handling
- Analyzer interoperability
- AI-ready infrastructure
- Offline-capable mobile app for field collection

---

# 3. User Roles

## Core Roles

### Patients
- Book tests
- View reports
- Pay online
- Track sample status

### Receptionist
- Register patients
- Generate invoices
- Manage bookings

### Phlebotomist
- View collection assignments
- Collect samples
- Scan barcodes
- Update collection status

### Lab Technician
- Process samples
- Enter results
- Manage QC

### Pathologist
- Validate results
- Release reports
- Add interpretations

### Branch Manager
- Monitor operations
- Revenue reports
- Staff management

### Super Admin
- Tenant management
- Pricing
- Configuration
- AI settings

---

# 4. Functional Modules

# 4.1 Patient Registration Module

## Features

- MR number generation
- CNIC/passport capture
- Mobile OTP verification
- Family linkage
- Duplicate patient detection
- Patient search
- Medical history linkage
- Consent management

## APIs

- Create patient
- Update patient
- Search patient
- Merge duplicate patient

---

# 4.2 Appointment & Booking Module

## Features

- Online booking
- Home sample booking
- Branch appointment booking
- WhatsApp booking
- Calendar scheduling
- Route assignment
- Slot management
- Booking reminders

## AI Features

- Smart route optimization
- Demand forecasting
- No-show prediction

---

# 4.3 Sample Collection & Barcode Module

## Features

- Barcode generation
- QR code labels
- Tube mapping
- Sample status tracking
- Chain of custody
- Rejection workflows
- Sample transfer tracking
- Cold-chain tracking

## Sample Statuses

- Registered
- Collected
- In Transit
- Received
- Processing
- Completed
- Verified
- Released

---

# 4.4 Laboratory Information System (LIS)

## Departments

- Hematology
- Biochemistry
- Microbiology
- Histopathology
- Molecular Diagnostics
- Immunology

## Features

- Worklists
- Result entry
- Delta checks
- Reference ranges
- Critical alerts
- Validation workflows
- Repeat test handling
- Reflex testing
- Test templates

---

# 4.5 Analyzer Integration Module

## Protocols

- HL7
- ASTM
- TCP/IP
- Serial communication

## Features

- Auto result import
- Device mapping
- Instrument monitoring
- Error handling
- QC integration

---

# 4.6 Reporting Module

## Features

- PDF reports
- QR verification
- Digital signatures
- Trend graphs
- WhatsApp delivery
- Email delivery
- Patient portal access
- Multi-language reporting

## AI Features

- AI interpretation summary
- Simplified patient explanation
- Abnormality highlighting

---

# 4.7 Billing & Finance Module

## Features

- Invoicing
- Discounts
- Corporate billing
- Insurance billing
- Franchise commissions
- Revenue reports
- Online payment gateway

## Integrations

- Stripe
- JazzCash
- Easypaisa
- GCC payment gateways

---

# 4.8 Inventory & Reagent Management

## Features

- Reagent inventory
- Batch tracking
- Expiry management
- Purchase orders
- Low stock alerts
- Analyzer consumables

## AI Features

- Reagent consumption prediction
- Stock forecasting

---

# 4.9 Franchise & Multi-Branch Module

## Features

- Multi-branch operations
- Central lab routing
- Franchise commissions
- Regional analytics
- Branch dashboards

---

# 4.10 AI Assistant Module

## Patient AI

- Explain report in Urdu/English
- Test recommendation assistant
- Follow-up reminders
- Health trend explanation

## Staff AI

- Result summarization
- Pathology draft comments
- Critical abnormality alerts
- Report consistency checks

## Operations AI

- TAT prediction
- Staffing optimization
- Revenue forecasting
- Fraud detection

---

# 4.11 QA/QC Module

## Quality Control Features

- Daily QC logs
- Levy-Jennings charts
- Westgard rules
- Calibration tracking
- Instrument maintenance logs
- CAPA workflows
- QC approval workflows
- Lot verification
- External quality assurance records

## Compliance Goals

- ISO 15189 readiness
- CAP compliance alignment
- Audit traceability

---

# 4.12 Mobile Applications

## Patient App

### Features

- Book tests
- Download reports
- Track sample status
- AI health explanation
- Payments
- Notifications

## Phlebotomist App

### Features

- Daily routes
- Barcode scanning
- GPS navigation
- Collection confirmation
- Offline mode
- Signature capture

---

# 5. Non-Functional Requirements

## Performance

- API response < 300ms
- 99.9% uptime target
- Horizontal scaling
- Multi-region support

## Security

- MFA
- RBAC
- Audit logging
- Database encryption
- Encrypted backups
- Secure PHI handling
- Device-level authorization

## Scalability

- Multi-tenant architecture
- Containerized services
- Event-driven workflows

## Availability

- Auto backups
- Disaster recovery
- High availability deployment

---

# 6. Suggested Tech Stack

# Frontend

## Web
- Next.js
- React
- TypeScript
- TailwindCSS
- ShadCN UI
- React Query

## Mobile
- React Native
- Expo
- TypeScript
- Offline sync support

---

# Backend

- NestJS or FastAPI
- PostgreSQL
- Redis
- RabbitMQ
- Elasticsearch/OpenSearch
- MinIO/S3

---

# AI Layer

- OpenAI APIs
- Local LLM support
- RAG pipelines
- LangChain/LlamaIndex

---

# DevOps

- Docker
- Kubernetes
- GitHub Actions
- Terraform
- NGINX

---

# Monitoring

- Prometheus
- Grafana
- Loki
- Sentry

---

# 7. System Architecture

## Recommended Architecture

- Modular monolith for MVP
- Gradual microservice extraction

## Suggested Services

- Auth Service
- Patient Service
- Billing Service
- LIS Service
- AI Service
- Notification Service
- Reporting Service
- Inventory Service

---

# 8. Multi-Tenant SaaS Design

## Strategy

- Database per tenant preferred
- Shared infrastructure
- Tenant-level branding
- Tenant-level feature toggles

## White Label Features

- Custom logo
- Domain mapping
- Report branding
- SMS templates
- WhatsApp templates

---

# 9. Integrations

## Communication

- WhatsApp Business API
- SMS gateways
- Email providers

## Medical Standards

- HL7
- ASTM
- FHIR

## Payments

- Stripe
- JazzCash
- Easypaisa

---

# 10. Security & Compliance

## Security Controls

- RBAC
- MFA
- Audit trails
- IP restrictions
- Device fingerprinting
- Session management

## Compliance Goals

- ISO 15189
- GDPR readiness
- HIPAA-inspired controls
- GCC data residency options

---

# 11. Reporting & Analytics

## Dashboards

- Revenue dashboard
- TAT dashboard
- QC dashboard
- Branch dashboard
- Analyzer utilization
- AI insights dashboard

---

# 12. Development Phases

# Phase 1 — MVP (3–4 Months)

## Scope

- Registration
- Booking
- Barcode workflow
- Manual result entry
- PDF reporting
- Billing
- WhatsApp delivery
- Basic dashboard

---

# Phase 2 — Commercial Version (6–9 Months)

## Scope

- Analyzer integrations
- Mobile apps
- Inventory
- AI summaries
- Multi-branch operations
- QC module

---

# Phase 3 — Enterprise Platform (12–18 Months)

## Scope

- Franchise operations
- Advanced AI
- Deep analytics
- GCC compliance
- Multi-region deployment
- AI copilots

---

# 13. Suggested Team Structure

## Core Team

- Product Manager
- Tech Lead
- Backend Engineers
- Frontend Engineers
- Mobile Engineers
- QA Engineers
- DevOps Engineer
- UI/UX Designer
- AI Engineer
- LIS Domain Consultant

---

# 14. Success Metrics

## Product Metrics

- TAT reduction
- Report delivery time
- Sample rejection rate
- Revenue per branch
- Patient retention
- AI usage rate

## Technical Metrics

- API latency
- Crash-free sessions
- Uptime
- Deployment frequency

---

# 15. Future Expansion

- Radiology integration
- Telemedicine
- Smart wearable integrations
- AI pathology imaging
- AI microbiology
- Genomics workflows
- Home diagnostics kits

---

# skill.md — QA_QC_Engineering

# Objective

This skill file guides Codex and engineering agents on how to implement enterprise-grade QA/QC workflows for laboratory operations.

---

# Core Principles

- Never bypass audit trails
- Every medical result change must be traceable
- All QC events require timestamp + user identity
- Critical alerts must never be silent
- Soft delete only
- Immutable release logs

---

# QA/QC Features

## Internal QC

- Daily QC runs
- Multi-level controls
- Westgard rules
- Levy-Jennings visualization
- Instrument calibration logs
- Reagent lot verification

## External QC

- CAP surveys
- Peer comparisons
- Proficiency testing

---

# Database Requirements

## Audit Fields

Every table must include:

- created_at
- updated_at
- created_by
- updated_by
- deleted_at
- tenant_id

---

# Mandatory Audit Tables

- audit_logs
- result_release_logs
- qc_events
- analyzer_error_logs
- calibration_logs

---

# Validation Rules

- Prevent release without pathologist approval
- Flag delta check abnormalities
- Reject expired reagent usage
- Block unauthorized modifications

---

# Testing Requirements

## Backend

- Unit tests
- Integration tests
- E2E tests
- Security tests
- API contract tests

## Frontend

- Component tests
- Accessibility tests
- Visual regression tests

## Mobile

- Offline sync testing
- Barcode scanning tests
- GPS tests
- Device compatibility tests

---

# Security Testing

- OWASP Top 10
- RBAC validation
- MFA testing
- Session hijack prevention
- SQL injection tests
- PHI leakage prevention

---

# Release Requirements

- No direct production deployment
- CI/CD mandatory
- Staging validation mandatory
- Database migration rollback mandatory

---

# skill.md — Frontend_Engineering

# Objective

This skill file guides Codex to generate scalable frontend architecture for web and mobile laboratory systems.

---

# Frontend Principles

- Mobile-first UI
- Minimalistic medical UI
- Fast workflows
- Accessibility compliance
- Offline resilience
- Reusable components

---

# Design Language

## Preferred Style

- Light theme
- Clean dashboards
- Soft shadows
- Minimal clutter
- High readability

## UI Stack

- Next.js
- TypeScript
- TailwindCSS
- ShadCN UI
- React Query
- Zustand

---

# Frontend Structure

/src
/components
/modules
/pages
/services
/hooks
/store
/types
/utils

---

# Mandatory Features

- Dark/light mode
- RTL support
- Urdu + Arabic localization
- Error boundaries
- Skeleton loading
- Optimistic updates

---

# UX Requirements

## Reception Workflows

- Registration under 60 seconds
- Large buttons
- Fast patient search
- Keyboard shortcuts

## Technician Workflows

- Barcode-first workflow
- Bulk result entry
- Minimal clicks

## Pathologist Workflows

- Fast validation
- Split-screen review
- Trend comparison

---

# Accessibility

- WCAG AA compliance
- Keyboard navigation
- Color contrast compliance
- Screen reader compatibility

---

# skill.md — Mobile_App_Engineering

# Objective

Guide Codex for developing enterprise-grade React Native mobile apps.

---

# Mobile Apps

## Patient App

- Booking
- Reports
- Notifications
- Payments
- AI explanations

## Phlebotomist App

- Barcode scanning
- Route management
- GPS navigation
- Offline sync
- Signature capture

---

# Mobile Tech Stack

- React Native
- Expo
- TypeScript
- React Query
- Zustand
- SQLite offline cache

---

# Offline Requirements

- Queue offline actions
- Auto sync on reconnect
- Conflict resolution
- Retry mechanism

---

# Mobile Security

- Biometric login
- Secure token storage
- Device authorization
- Encrypted local storage

---

# Barcode & Camera

- QR scanning
- Barcode scanning
- Image compression
- Low-light optimization

---

# Push Notifications

- Firebase Cloud Messaging
- Appointment reminders
- Critical alerts
- Report readiness

---

# Performance Targets

- App startup < 3 seconds
- Smooth scrolling
- Offline-first experience
- Crash-free sessions > 99%

---

# CI/CD Requirements

- Automated builds
- OTA updates
- Crash reporting
- Feature flags

---

# skill.md — Codex_Master_Instructions

# Objective

Master operational instructions for Codex while generating code for the Diagnostic Laboratory SaaS platform.

---

# Engineering Rules

- Use TypeScript everywhere
- Strict typing mandatory
- No hardcoded secrets
- Use environment variables
- Follow modular architecture
- Multi-tenant support mandatory

---

# Coding Standards

- ESLint mandatory
- Prettier mandatory
- Conventional commits
- Feature-based folder structure

---

# Backend Rules

- DTO validation mandatory
- OpenAPI docs mandatory
- RBAC mandatory
- Audit logs mandatory
- Transaction safety mandatory

---

# Frontend Rules

- Component reuse mandatory
- Responsive design mandatory
- Accessibility mandatory
- State normalization mandatory

---

# Database Rules

- UUID primary keys
- Soft deletes
- Index optimization
- Foreign key constraints
- Migration-based schema updates

---

# AI Rules

- AI suggestions must never auto-release reports
- Human validation mandatory
- Prompt logging mandatory
- AI explainability preferred

---

# Security Rules

- Encrypt PHI
- Rate limiting mandatory
- MFA support mandatory
- Secure cookies mandatory
- OWASP compliance mandatory

---

# Documentation Requirements

- Swagger/OpenAPI
- Architecture diagrams
- ER diagrams
- API examples
- Deployment guides

---

# DevOps Rules

- Docker mandatory
- CI/CD mandatory
- Infrastructure as code preferred
- Health checks mandatory

---

# Deployment Targets

- AWS
- Azure
- DigitalOcean
- On-premise option

---

# Success Criteria

- Scalable
- Secure
- Auditable
- AI-ready
- Fast
- Maintainable

