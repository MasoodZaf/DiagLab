INSERT INTO tenants (id, slug, brand_name, locale, timezone, config)
VALUES
  ('tenant_lumen', 'lumen', 'Lumen Diagnostics', 'en-PK', 'Asia/Karachi', '{}'::jsonb),
  ('tenant_cedar', 'cedar', 'Cedar PathLab', 'en-GB', 'Europe/London', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO staff_users (id, tenant_id, role, display_name, branch_name, capabilities)
VALUES
  ('sess_lumen_reception', 'tenant_lumen', 'receptionist', 'Sana Waheed', 'Gulberg', '[]'::jsonb),
  ('sess_lumen_phleb', 'tenant_lumen', 'phlebotomist', 'Bilal Ahmed', 'Gulberg', '[]'::jsonb),
  ('sess_lumen_tech', 'tenant_lumen', 'technician', 'Usman Tariq', 'Central Lab', '[]'::jsonb),
  ('sess_lumen_path', 'tenant_lumen', 'pathologist', 'Dr. Mehak Ali', 'Central Lab', '[]'::jsonb),
  ('sess_cedar_reception', 'tenant_cedar', 'receptionist', 'Clare Mason', 'London City', '[]'::jsonb),
  ('sess_cedar_phleb', 'tenant_cedar', 'phlebotomist', 'Maya Ellis', 'London City', '[]'::jsonb),
  ('sess_cedar_tech', 'tenant_cedar', 'technician', 'Ibrahim Nadeem', 'Core Bench', '[]'::jsonb),
  ('sess_cedar_path', 'tenant_cedar', 'pathologist', 'Dr. Hannah Cole', 'Core Bench', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO patients (
  id, tenant_id, mrn, full_name, phone, national_id, date_of_birth, sex, consented_at,
  created_at, updated_at, created_by, updated_by
)
VALUES
  ('pat_lum_1', 'tenant_lumen', 'LM-240218', 'Areeba Khan', '+92 300 555 0101', '35202-1234567-8', '1994-06-16', 'female', '2026-05-26T08:11:00Z', '2026-05-26T08:11:00Z', '2026-05-26T08:11:00Z', 'Sana Waheed', 'Sana Waheed'),
  ('pat_lum_2', 'tenant_lumen', 'LM-240219', 'Faisal Raza', '+92 301 555 1112', '35202-2345678-9', '1988-02-12', 'male', '2026-05-26T08:35:00Z', '2026-05-26T08:35:00Z', '2026-05-26T08:35:00Z', 'Sana Waheed', 'Sana Waheed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO appointments (
  id, tenant_id, patient_id, status, channel, scheduled_at, branch_name,
  created_at, updated_at, created_by, updated_by
)
VALUES
  ('apt_lum_1', 'tenant_lumen', 'pat_lum_1', 'assigned', 'home_collection', '2026-05-27T06:30:00Z', 'Gulberg', '2026-05-26T08:15:00Z', '2026-05-27T05:50:00Z', 'Sana Waheed', 'Sana Waheed'),
  ('apt_lum_2', 'tenant_lumen', 'pat_lum_2', 'completed', 'walk_in', '2026-05-27T08:00:00Z', 'Central Lab', '2026-05-26T09:05:00Z', '2026-05-27T08:50:00Z', 'Sana Waheed', 'Sana Waheed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO lab_orders (
  id, tenant_id, patient_id, appointment_id, order_number, tests, status, branch_name, home_collection,
  created_at, updated_at, created_by, updated_by
)
VALUES
  ('ord_lum_1', 'tenant_lumen', 'pat_lum_1', 'apt_lum_1', 'LUM-2026-4012', '["CBC", "Ferritin", "Vitamin D"]'::jsonb, 'in_progress', 'Gulberg', true, '2026-05-26T08:20:00Z', '2026-05-27T06:40:00Z', 'Sana Waheed', 'Usman Tariq'),
  ('ord_lum_2', 'tenant_lumen', 'pat_lum_2', 'apt_lum_2', 'LUM-2026-4013', '["HbA1c", "Fasting Glucose"]'::jsonb, 'awaiting_release', 'Central Lab', false, '2026-05-26T09:10:00Z', '2026-05-27T09:12:00Z', 'Sana Waheed', 'Usman Tariq')
ON CONFLICT (id) DO NOTHING;

INSERT INTO samples (
  id, tenant_id, order_id, barcode, specimen, status, collected_at, last_checkpoint,
  created_at, updated_at, created_by, updated_by
)
VALUES
  ('sam_lum_1', 'tenant_lumen', 'ord_lum_1', 'LMBC2404012', 'Serum', 'processing', '2026-05-27T06:35:00Z', 'Analyzer prep bench', '2026-05-26T08:20:00Z', '2026-05-27T07:45:00Z', 'Sana Waheed', 'Usman Tariq'),
  ('sam_lum_2', 'tenant_lumen', 'ord_lum_2', 'LMBC2404013', 'Whole blood', 'verified', '2026-05-27T08:10:00Z', 'Pathologist validation queue', '2026-05-26T09:10:00Z', '2026-05-27T09:05:00Z', 'Sana Waheed', 'Dr. Mehak Ali')
ON CONFLICT (id) DO NOTHING;

INSERT INTO results (
  id, tenant_id, order_id, sample_id, test_name, status, value, reference_range, abnormal, critical, validator_name,
  created_at, updated_at, created_by, updated_by
)
VALUES
  ('res_lum_1', 'tenant_lumen', 'ord_lum_1', 'sam_lum_1', 'Ferritin', 'entered', '22 ng/mL', '13 - 150', false, false, null, '2026-05-27T07:50:00Z', '2026-05-27T07:50:00Z', 'Usman Tariq', 'Usman Tariq'),
  ('res_lum_2', 'tenant_lumen', 'ord_lum_2', 'sam_lum_2', 'HbA1c', 'validated', '9.1 %', '4.0 - 5.6', true, true, 'Dr. Mehak Ali', '2026-05-27T08:55:00Z', '2026-05-27T09:05:00Z', 'Usman Tariq', 'Dr. Mehak Ali')
ON CONFLICT (id) DO NOTHING;

INSERT INTO invoices (
  id, tenant_id, order_id, invoice_number, status, total_amount, paid_amount, currency,
  created_at, updated_at, created_by, updated_by
)
VALUES
  ('inv_lum_1', 'tenant_lumen', 'ord_lum_1', 'INV-LUM-9811', 'paid', 8700, 8700, 'PKR', '2026-05-26T08:21:00Z', '2026-05-26T08:22:00Z', 'Sana Waheed', 'Sana Waheed'),
  ('inv_lum_2', 'tenant_lumen', 'ord_lum_2', 'INV-LUM-9812', 'partially_paid', 4300, 2000, 'PKR', '2026-05-26T09:12:00Z', '2026-05-27T08:12:00Z', 'Sana Waheed', 'Sana Waheed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO reports (
  id, tenant_id, order_id, report_number, status, released_at, released_by, amendment_note,
  created_at, updated_at, created_by, updated_by
)
VALUES
  ('rep_lum_1', 'tenant_lumen', 'ord_lum_2', 'RPT-LUM-4401', 'draft', null, null, null, '2026-05-27T09:07:00Z', '2026-05-27T09:07:00Z', 'Dr. Mehak Ali', 'Dr. Mehak Ali')
ON CONFLICT (id) DO NOTHING;

INSERT INTO critical_alerts (
  id, tenant_id, result_id, patient_id, status, acknowledged_by, acknowledged_at,
  created_at, updated_at, created_by, updated_by
)
VALUES
  ('crit_lum_1', 'tenant_lumen', 'res_lum_2', 'pat_lum_2', 'open', null, null, '2026-05-27T09:05:00Z', '2026-05-27T09:05:00Z', 'Dr. Mehak Ali', 'Dr. Mehak Ali')
ON CONFLICT (id) DO NOTHING;
