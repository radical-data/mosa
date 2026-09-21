begin;
create schema publication;
revoke all on schema publication from public, anon, authenticated, explorer_reader;
create role collection_publisher nologin;
-- This is a trusted maintainer role, never a website runtime role.
grant explorer_reader to collection_publisher;
grant usage on schema publication to collection_publisher;

create table publication.release (
    id uuid primary key,
    selection jsonb,
    fingerprint text,
    snapshot jsonb not null,
    prepared_at timestamptz not null default now(),
    approved_by text check (length(btrim(approved_by)) > 0),
    authority text check (length(btrim(authority)) > 0),
    approved_at timestamptz,
    withdrawn_by text check (length(btrim(withdrawn_by)) > 0),
    withdrawn_at timestamptz,
    check ((selection is null) = (fingerprint is null)),
    check ((approved_at is null) = (approved_by is null)),
    check ((approved_at is null) = (authority is null)),
    check ((withdrawn_at is null) = (withdrawn_by is null))
);
create table publication.state (
    singleton boolean primary key default true check (singleton),
    desired_release_id uuid not null references publication.release(id),
    live_release_id uuid references publication.release(id),
    live_verified_at timestamptz,
    pending_release_id uuid references publication.release(id),
    pending_started_at timestamptz
);
-- Explicit empty starting collection. It does not authorise any research content.
insert into publication.release (id, snapshot) values (
    '00000000-0000-4000-8000-000000000000',
    '{"schemaVersion":1,"releaseId":"00000000-0000-4000-8000-000000000000","records":[]}'
);
insert into publication.state (desired_release_id) values ('00000000-0000-4000-8000-000000000000');

create table publication.deployment_recovery (
    id uuid primary key default gen_random_uuid(),
    release_id uuid not null references publication.release(id),
    actor text not null,
    reason text not null,
    recorded_at timestamptz not null default now()
);
alter table publication.deployment_recovery enable row level security;
grant select, insert on publication.deployment_recovery to collection_publisher;
create policy maintainer_recovery on publication.deployment_recovery to collection_publisher using (true) with check (true);

alter table publication.release enable row level security;
alter table publication.state enable row level security;
grant select, insert, update on publication.release to collection_publisher;
grant select, update on publication.state to collection_publisher;
create policy maintainer_release on publication.release to collection_publisher using (true) with check (true);
create policy maintainer_state on publication.state to collection_publisher using (true) with check (true);

create function publication.protect_release() returns trigger
language plpgsql set search_path = '' as $$
begin
    if new.id is distinct from old.id or new.selection is distinct from old.selection
       or new.fingerprint is distinct from old.fingerprint or new.snapshot is distinct from old.snapshot
       or new.prepared_at is distinct from old.prepared_at then
        raise exception 'Prepared releases are immutable';
    end if;
    if old.approved_at is not null and (new.approved_by is distinct from old.approved_by
       or new.authority is distinct from old.authority or new.approved_at is distinct from old.approved_at) then
        raise exception 'Publication decisions are immutable';
    end if;
    if old.withdrawn_at is not null then raise exception 'Withdrawn releases are immutable'; end if;
    return new;
end;
$$;
revoke all on function publication.protect_release() from public;
create trigger protect_release before update on publication.release
for each row execute function publication.protect_release();
commit;
