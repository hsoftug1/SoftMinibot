-- SoftMinibot Supabase schema: use on a NEW dedicated Supabase project.
-- Do not apply platform/database/001_initial.sql alongside this migration.
create extension if not exists pgcrypto;
create table if not exists public.tenants(id uuid primary key default gen_random_uuid(),name text not null,created_at timestamptz not null default now());
create table if not exists public.tenant_members(tenant_id uuid not null references public.tenants(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,role text not null check(role in ('owner','admin','viewer')),primary key(tenant_id,user_id));
create table if not exists public.bot_instances(id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id) on delete cascade,display_name text not null,status text not null default 'disconnected' check(status in ('disconnected','pairing','connected','error')),credential_secret_ref text,created_at timestamptz not null default now(),unique(id,tenant_id));
create table if not exists public.pairing_requests(id uuid primary key default gen_random_uuid(),tenant_id uuid not null,bot_instance_id uuid not null,status text not null default 'pending' check(status in ('pending','paired','expired','cancelled','failed')),expires_at timestamptz not null,created_at timestamptz not null default now(),foreign key(bot_instance_id,tenant_id) references public.bot_instances(id,tenant_id) on delete cascade);
create index if not exists pairing_active_idx on public.pairing_requests(bot_instance_id,status,expires_at);
create table if not exists public.audit_events(id bigint generated always as identity primary key,tenant_id uuid not null references public.tenants(id) on delete cascade,actor_user_id uuid references auth.users(id) on delete set null,action text not null,created_at timestamptz not null default now());
create schema if not exists private;
create or replace function private.is_member(t uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.tenant_members where tenant_id=t and user_id=(select auth.uid()))$$;
create or replace function private.can_manage(t uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.tenant_members where tenant_id=t and user_id=(select auth.uid()) and role in ('owner','admin'))$$;
revoke all on function private.is_member(uuid) from public,anon;
revoke all on function private.can_manage(uuid) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.is_member(uuid),private.can_manage(uuid) to authenticated;
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.bot_instances enable row level security;
alter table public.pairing_requests enable row level security;
alter table public.audit_events enable row level security;
create policy tenants_read on public.tenants for select to authenticated using(private.is_member(id));
create policy members_read on public.tenant_members for select to authenticated using(private.is_member(tenant_id));
create policy bots_read on public.bot_instances for select to authenticated using(private.is_member(tenant_id));
create policy bots_insert on public.bot_instances for insert to authenticated with check(private.can_manage(tenant_id) and status='disconnected' and credential_secret_ref is null);
create policy pairs_read on public.pairing_requests for select to authenticated using(private.is_member(tenant_id));
create policy pairs_insert on public.pairing_requests for insert to authenticated with check(private.can_manage(tenant_id) and status='pending' and expires_at>now() and expires_at<=now()+interval '3 minutes');
create policy audit_read on public.audit_events for select to authenticated using(private.is_member(tenant_id));
-- Provision one workspace per new auth account in a private trigger.
create or replace function private.provision_user_workspace() returns trigger language plpgsql security definer set search_path='' as $$
declare t uuid;
begin
 insert into public.tenants(name) values('My workspace') returning id into t;
 insert into public.tenant_members(tenant_id,user_id,role) values(t,new.id,'owner');
 return new;
end $$;
drop trigger if exists on_softminibot_signup on auth.users;
create trigger on_softminibot_signup after insert on auth.users for each row execute function private.provision_user_workspace();
revoke all on function private.provision_user_workspace() from public,anon,authenticated;
-- Never grant clients UPDATE/DELETE on bot_instances, pairing_requests or tenant memberships.
