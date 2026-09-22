begin;

create table capture.source (
    id uuid primary key,
    owner_id uuid not null references capture.researcher(user_id),
    citation text not null check(length(btrim(citation)) between 1 and 2000),
    author text not null default '',
    document_date text not null default '',
    hidden boolean not null default false,
    created_at timestamptz not null default now()
);
create index source_owner on capture.source(owner_id, created_at desc);
create table capture.source_version (
    id uuid primary key,
    source_id uuid not null references capture.source(id),
    filename text not null,
    media_type text not null,
    byte_count integer not null check(byte_count between 1 and 20000000),
    sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
    storage_key text not null unique,
    state text not null default 'uploading' check(state in ('uploading','ready')),
    created_at timestamptz not null default now()
);
create index source_version_source on capture.source_version(source_id);
alter table capture.source enable row level security;
alter table capture.source_version enable row level security;
grant select, insert on capture.source, capture.source_version to capture_writer;
grant update(hidden) on capture.source to capture_writer;
grant update(state) on capture.source_version to capture_writer;
create policy own_sources on capture.source for all to capture_writer
using (owner_id=nullif(current_setting('capture.actor',true),'')::uuid
    and exists(select 1 from capture.researcher r where r.user_id=owner_id and r.enabled))
with check (owner_id=nullif(current_setting('capture.actor',true),'')::uuid
    and exists(select 1 from capture.researcher r where r.user_id=owner_id and r.enabled));
create policy own_versions on capture.source_version for all to capture_writer
using (exists(select 1 from capture.source s where s.id=source_id))
with check (exists(select 1 from capture.source s where s.id=source_id));

-- Storage is disabled in the database-only local stack. Hosted projects have it.
do $$ begin
    if to_regclass('storage.buckets') is not null then
        insert into storage.buckets(id,name,public,file_size_limit)
        values('research-sources','research-sources',false,20000000)
        on conflict(id) do nothing;
        if exists(select 1 from storage.buckets where id='research-sources' and public) then
            raise exception 'research-sources must be a private bucket';
        end if;
    end if;
end $$;
commit;
