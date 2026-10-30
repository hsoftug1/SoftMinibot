create table if not exists public.bot_privacy_settings(
 bot_instance_id uuid primary key references public.bot_instances(id) on delete cascade,
 anti_delete_enabled boolean not null default false,
 retention_hours integer not null default 24 check(retention_hours between 1 and 168),
 updated_at timestamptz not null default now()
);
alter table public.bot_privacy_settings enable row level security;
create policy bot_privacy_owner_read on public.bot_privacy_settings for select to authenticated
 using(exists(select 1 from public.bot_instances b join public.tenant_members m on m.tenant_id=b.tenant_id where b.id=bot_instance_id and m.user_id=(select auth.uid()) and m.role='owner'));
create policy bot_privacy_owner_insert on public.bot_privacy_settings for insert to authenticated
 with check(exists(select 1 from public.bot_instances b join public.tenant_members m on m.tenant_id=b.tenant_id where b.id=bot_instance_id and m.user_id=(select auth.uid()) and m.role='owner'));
create policy bot_privacy_owner_update on public.bot_privacy_settings for update to authenticated
 using(exists(select 1 from public.bot_instances b join public.tenant_members m on m.tenant_id=b.tenant_id where b.id=bot_instance_id and m.user_id=(select auth.uid()) and m.role='owner'))
 with check(exists(select 1 from public.bot_instances b join public.tenant_members m on m.tenant_id=b.tenant_id where b.id=bot_instance_id and m.user_id=(select auth.uid()) and m.role='owner'));
create table if not exists public.retained_deleted_messages(
 id uuid primary key default gen_random_uuid(),
 bot_instance_id uuid not null references public.bot_instances(id) on delete cascade,
 message_key_hash text not null,
 ciphertext text not null,
 received_at timestamptz not null default now(),
 expires_at timestamptz not null,
 deleted_at timestamptz,
 unique(bot_instance_id,message_key_hash)
);
create index if not exists retained_deleted_messages_expiry_idx on public.retained_deleted_messages(expires_at);
alter table public.retained_deleted_messages enable row level security;
revoke all on public.retained_deleted_messages from anon,authenticated;
grant select,insert,update on public.bot_privacy_settings to authenticated;
