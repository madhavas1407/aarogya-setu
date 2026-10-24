-- PostgreSQL schema for the consent-scoped booking workflow.
-- Apply with: psql "$DATABASE_URL" -f db/schema.sql
-- Keep patient identifiers and contact data out of application logs.

CREATE TABLE IF NOT EXISTS facilities (
  -- Google Place IDs may be retained. Google Places display content is fetched live, never copied here.
  id text PRIMARY KEY,
  source text NOT NULL,
  source_record_id text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY,
  mobile_ciphertext bytea NOT NULL,
  mobile_nonce bytea NOT NULL,
  mobile_auth_tag bytea NOT NULL,
  mobile_lookup_hash bytea NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hospital_users (
  id uuid PRIMARY KEY,
  facility_id text NOT NULL REFERENCES facilities(id),
  identity_subject text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash bytea PRIMARY KEY,
  actor_type text NOT NULL CHECK (actor_type IN ('patient', 'hospital')),
  patient_id uuid REFERENCES patients(id),
  hospital_user_id uuid REFERENCES hospital_users(id),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (actor_type = 'patient' AND patient_id IS NOT NULL AND hospital_user_id IS NULL) OR
    (actor_type = 'hospital' AND hospital_user_id IS NOT NULL AND patient_id IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS sessions_patient_idx ON sessions(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS sessions_hospital_idx ON sessions(hospital_user_id) WHERE hospital_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS consents (
  id uuid PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES patients(id),
  facility_id text NOT NULL REFERENCES facilities(id),
  purpose text NOT NULL CHECK (purpose = 'appointment_contact'),
  consent_text_version text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consents_patient_facility_idx ON consents(patient_id, facility_id, expires_at);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES patients(id),
  facility_id text NOT NULL REFERENCES facilities(id),
  consent_id uuid NOT NULL REFERENCES consents(id),
  specialty text NOT NULL,
  requested_at timestamptz,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'declined', 'cancelled')),
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_facility_status_idx ON bookings(facility_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_patient_idx ON bookings(patient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS access_audit (
  id uuid PRIMARY KEY,
  actor_type text NOT NULL CHECK (actor_type IN ('patient', 'hospital', 'system')),
  actor_id uuid,
  patient_id uuid REFERENCES patients(id),
  facility_id text REFERENCES facilities(id),
  booking_id uuid REFERENCES bookings(id),
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS access_audit_patient_idx ON access_audit(patient_id, created_at DESC);
