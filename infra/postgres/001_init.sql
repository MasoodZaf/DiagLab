CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE tenants (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  brand_name text NOT NULL,
  locale text NOT NULL,
  timezone text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE staff_users (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role text NOT NULL,
  display_name text NOT NULL,
  branch_name text,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (role IN ('patient', 'receptionist', 'phlebotomist', 'rider', 'technician', 'pathologist', 'branch_manager', 'lab_admin', 'super_admin'))
);

CREATE TABLE patients (
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
  UNIQUE (tenant_id, national_id),
  CHECK (sex IN ('female', 'male', 'other'))
);

CREATE TABLE appointments (
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
  updated_by text NOT NULL,
  CHECK (status IN ('draft', 'scheduled', 'confirmed', 'assigned', 'completed', 'cancelled', 'no_show')),
  CHECK (channel IN ('walk_in', 'portal', 'whatsapp', 'home_collection'))
);

CREATE TABLE lab_orders (
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
  UNIQUE (tenant_id, order_number),
  CHECK (status IN ('registered', 'in_progress', 'awaiting_release', 'released'))
);

CREATE TABLE samples (
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
  UNIQUE (tenant_id, barcode),
  CHECK (status IN ('registered', 'scheduled', 'collected', 'in_transit', 'received', 'processing', 'completed', 'verified', 'released', 'rejected', 'cancelled', 'amended'))
);

CREATE TABLE results (
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
  updated_by text NOT NULL,
  CHECK (status IN ('draft', 'entered', 'flagged', 'validated', 'released', 'amended'))
);

CREATE TABLE invoices (
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
  UNIQUE (tenant_id, invoice_number),
  CHECK (status IN ('draft', 'issued', 'partially_paid', 'paid', 'refunded', 'void')),
  CHECK (currency IN ('PKR', 'GBP', 'SAR'))
);

CREATE TABLE reports (
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
  UNIQUE (tenant_id, report_number),
  CHECK (status IN ('draft', 'released', 'amended'))
);

CREATE TABLE report_amendments (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_id text NOT NULL REFERENCES reports(id) ON DELETE RESTRICT,
  version integer NOT NULL,
  note text NOT NULL,
  amended_by text NOT NULL,
  amended_at timestamptz NOT NULL,
  UNIQUE (tenant_id, report_id, version)
);

CREATE TABLE critical_alerts (
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
  updated_by text NOT NULL,
  CHECK (status IN ('open', 'acknowledged', 'closed'))
);

CREATE TABLE audit_logs (
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

CREATE INDEX idx_patients_tenant_search ON patients (tenant_id, full_name, phone);
CREATE INDEX idx_orders_tenant_status ON lab_orders (tenant_id, status);
CREATE INDEX idx_samples_tenant_status ON samples (tenant_id, status);
CREATE INDEX idx_results_tenant_status ON results (tenant_id, status);
CREATE INDEX idx_reports_tenant_status ON reports (tenant_id, status);
CREATE INDEX idx_report_amendments_tenant_report ON report_amendments (tenant_id, report_id, version);
CREATE INDEX idx_alerts_tenant_status ON critical_alerts (tenant_id, status);
CREATE INDEX idx_audit_logs_tenant_entity ON audit_logs (tenant_id, entity_type, entity_id);
