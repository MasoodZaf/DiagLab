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

CREATE INDEX IF NOT EXISTS idx_report_amendments_tenant_report ON report_amendments (tenant_id, report_id, version);
