begin;
alter table capture.source add column original_url text;
create unique index source_owner_url on capture.source(owner_id,original_url) where original_url is not null;
alter table capture.source_version add column readable_text text;
alter table capture.source_version add column manifest jsonb;
create table capture.job (
 id uuid primary key,
 owner_id uuid not null references capture.researcher(user_id),
 source_id uuid not null references capture.source(id),
 kind text not null check(kind in ('capture')),
 status text not null default 'queued' check(status in ('queued','running','succeeded','failed','paused')),
 attempts integer not null default 0,
 lease uuid,
 lease_until timestamptz,
 input jsonb not null default '{}',
 result jsonb not null default '{}',
 error text,
 created_at timestamptz not null default now()
);
create index job_queue on capture.job(status,created_at);
create index job_owner on capture.job(owner_id,created_at desc);
alter table capture.job enable row level security;
grant select,insert on capture.job to capture_writer;
grant update(status,error,attempts) on capture.job to capture_writer;
create policy own_jobs on capture.job to capture_writer using (
 owner_id=nullif(current_setting('capture.actor',true),'')::uuid
 and exists(select 1 from capture.researcher r where r.user_id=owner_id and r.enabled)
) with check (
 owner_id=nullif(current_setting('capture.actor',true),'')::uuid
 and exists(select 1 from capture.source s where s.id=source_id and s.owner_id=owner_id)
);
create role capture_worker nologin;
grant usage on schema capture to capture_worker;
grant select on capture.researcher to capture_worker;
create policy worker_researchers on capture.researcher for select to capture_worker using(true);
grant select,insert on capture.source,capture.source_version to capture_worker;
grant update(state) on capture.source_version to capture_worker;
alter policy own_sources on capture.source to capture_writer,capture_worker;
alter policy own_versions on capture.source_version to capture_writer,capture_worker;
grant select,update on capture.job to capture_worker;
create policy worker_jobs on capture.job to capture_worker using(true) with check(true);
commit;
