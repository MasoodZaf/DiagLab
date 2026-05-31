/**
 * Idempotent Postgres DDL for the AURA LIMS demo.
 *
 * The web app self-bootstraps its schema on first DB access (see db.ts), so the
 * demo "just works" against an empty Postgres instance with no manual migration
 * step. This mirrors infra/postgres/001_init.sql (canonical for the NestJS API)
 * and adds the org tables (outlets / panel_doctors / staff) that the Lab Admin
 * "add doctor / add staff" flows persist into.
 */
export const schemaSql = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tenants (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  brand_name text NOT NULL,
  locale text NOT NULL,
  timezone text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_users (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role text NOT NULL,
  display_name text NOT NULL,
  branch_name text,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mrn text NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  national_id text NOT NULL,
  date_of_birth date NOT NULL,
  sex text NOT NULL,
  consented_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  created_by text NOT NULL,
  updated_by text NOT NULL,
  UNIQUE (tenant_id, mrn),
  UNIQUE (tenant_id, national_id)
);

CREATE TABLE IF NOT EXISTS appointments (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id text NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  status text NOT NULL,
  channel text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  branch_name text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  created_by text NOT NULL,
  updated_by text NOT NULL
);

CREATE TABLE IF NOT EXISTS lab_orders (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id text NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  appointment_id text NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
  order_number text NOT NULL,
  tests jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL,
  branch_name text NOT NULL,
  home_collection boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  created_by text NOT NULL,
  updated_by text NOT NULL,
  UNIQUE (tenant_id, order_number)
);

CREATE TABLE IF NOT EXISTS samples (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id text NOT NULL REFERENCES lab_orders(id) ON DELETE RESTRICT,
  barcode text NOT NULL,
  specimen text NOT NULL,
  status text NOT NULL,
  collected_at timestamptz,
  last_checkpoint text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  created_by text NOT NULL,
  updated_by text NOT NULL,
  UNIQUE (tenant_id, barcode)
);

CREATE TABLE IF NOT EXISTS results (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id text NOT NULL REFERENCES lab_orders(id) ON DELETE RESTRICT,
  sample_id text NOT NULL REFERENCES samples(id) ON DELETE RESTRICT,
  test_name text NOT NULL,
  status text NOT NULL,
  value text NOT NULL,
  reference_range text NOT NULL,
  abnormal boolean NOT NULL DEFAULT false,
  critical boolean NOT NULL DEFAULT false,
  validator_name text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  created_by text NOT NULL,
  updated_by text NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id text NOT NULL REFERENCES lab_orders(id) ON DELETE RESTRICT,
  invoice_number text NOT NULL,
  status text NOT NULL,
  total_amount numeric(12, 2) NOT NULL,
  paid_amount numeric(12, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  created_by text NOT NULL,
  updated_by text NOT NULL,
  UNIQUE (tenant_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS reports (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id text NOT NULL REFERENCES lab_orders(id) ON DELETE RESTRICT,
  report_number text NOT NULL,
  status text NOT NULL,
  released_at timestamptz,
  released_by text,
  amendment_note text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  created_by text NOT NULL,
  updated_by text NOT NULL,
  UNIQUE (tenant_id, report_number)
);

CREATE TABLE IF NOT EXISTS report_amendments (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_id text NOT NULL REFERENCES reports(id) ON DELETE RESTRICT,
  version integer NOT NULL,
  note text NOT NULL,
  amended_by text NOT NULL,
  amended_at timestamptz NOT NULL,
  UNIQUE (tenant_id, report_id, version)
);

CREATE TABLE IF NOT EXISTS critical_alerts (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  result_id text NOT NULL REFERENCES results(id) ON DELETE RESTRICT,
  patient_id text NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  status text NOT NULL,
  acknowledged_by text,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  created_by text NOT NULL,
  updated_by text NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_name text NOT NULL,
  actor_role text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Organisation config (managed in the Lab Admin area). Outlets, the consultant
-- panel, and the on-ground team — what the "add doctor / add staff" flows write to.
CREATE TABLE IF NOT EXISTS outlets (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  city text NOT NULL,
  type text NOT NULL,
  address text,
  phone text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS panel_doctors (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  specialty text NOT NULL,
  qualification text NOT NULL,
  outlet_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  outlet_id text,
  phone text,
  status text NOT NULL DEFAULT 'active',
  email text,
  login_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_tenant_search ON patients (tenant_id, full_name, phone);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON lab_orders (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_samples_tenant_status ON samples (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_results_tenant_status ON results (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_tenant_status ON reports (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_report_amendments_tenant_report ON report_amendments (tenant_id, report_id, version);
CREATE INDEX IF NOT EXISTS idx_alerts_tenant_status ON critical_alerts (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_entity ON audit_logs (tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_doctors_tenant ON panel_doctors (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff (tenant_id, status);
`;
