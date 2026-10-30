-- SoftMinibot initial multi-tenant data model (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS platform_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tenant_members (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','viewer')),
  PRIMARY KEY (tenant_id,user_id)
);
CREATE TABLE IF NOT EXISTS bot_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected','pairing','connected','error')),
  credential_secret_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id,tenant_id)
);
CREATE INDEX IF NOT EXISTS bot_instances_tenant_idx ON bot_instances(tenant_id);
CREATE TABLE IF NOT EXISTS pairing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  bot_instance_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paired','expired','cancelled','failed')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (bot_instance_id,tenant_id) REFERENCES bot_instances(id,tenant_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS pairing_requests_instance_idx ON pairing_requests(bot_instance_id,created_at DESC);
CREATE TABLE IF NOT EXISTS audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES platform_users(id) ON DELETE SET NULL,
  bot_instance_id uuid,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (bot_instance_id,tenant_id) REFERENCES bot_instances(id,tenant_id) ON DELETE SET NULL (bot_instance_id)
);
CREATE INDEX IF NOT EXISTS audit_events_tenant_time_idx ON audit_events(tenant_id,created_at DESC);
-- IMPORTANT: Database permissions and application tenant checks must be implemented before production.
