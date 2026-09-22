begin;
create table capture.bundle (
    owner_id uuid not null references capture.researcher(user_id),
    id uuid not null,
    checksum text not null check(checksum ~ '^[0-9a-f]{64}$'),
    state text not null default 'uploading' check(state in ('uploading','ready')),
    manifest jsonb not null,
    drafts jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    primary key(owner_id,id)
);
create index bundle_owner_created on capture.bundle(owner_id,created_at desc);
alter table capture.bundle enable row level security;
grant select,insert on capture.bundle to capture_writer;
grant update(state,drafts) on capture.bundle to capture_writer;
create policy own_bundles on capture.bundle to capture_writer
using (owner_id=nullif(current_setting('capture.actor',true),'')::uuid
 and exists(select 1 from capture.researcher r where r.user_id=owner_id and r.enabled))
with check (owner_id=nullif(current_setting('capture.actor',true),'')::uuid
 and exists(select 1 from capture.researcher r where r.user_id=owner_id and r.enabled));
commit;
