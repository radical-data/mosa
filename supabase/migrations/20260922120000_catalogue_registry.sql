begin;

-- These labels describe identifier systems, not attributed institution names.
-- Keep existing namespaces stable; a rename never changes object identity.
create table entities.catalogue (
  namespace text primary key default ('catalogue-' || gen_random_uuid()::text)
    check (length(btrim(namespace)) > 0),
  label text check (label is null or (length(btrim(label)) between 1 and 200))
);
create unique index catalogue_label_unique on entities.catalogue
  (lower(regexp_replace(btrim(label), '\s+', ' ', 'g'))) where label is not null;

-- Register what is actually present, including unfinished capture work.
-- No museum list or guessed labels are embedded in the application or migration.
insert into entities.catalogue(namespace)
select namespace from entities.external_identifier
union
select content->>'namespace' from capture.draft
where length(btrim(content->>'namespace')) > 0;

alter table entities.external_identifier add constraint external_identifier_catalogue_fkey
  foreign key(namespace) references entities.catalogue(namespace);

-- Preserve existing imports and fixture writes. New identifier systems become
-- available to researchers immediately; they can supply the readable label.
create function entities.register_identifier_catalogue() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into entities.catalogue(namespace) values(new.namespace)
    on conflict(namespace) do nothing;
  return new;
end;
$$;
revoke all on function entities.register_identifier_catalogue() from public,anon,authenticated;
create trigger register_identifier_catalogue
  before insert or update of namespace on entities.external_identifier
  for each row execute function entities.register_identifier_catalogue();

alter table entities.catalogue enable row level security;
revoke all on entities.catalogue from public,anon,authenticated;
grant select on entities.catalogue to explorer_reader;
grant insert(label), update(label) on entities.catalogue to capture_writer;
create policy catalogue_read on entities.catalogue for select to explorer_reader using(true);
create policy catalogue_create on entities.catalogue for insert to capture_writer
  with check(exists(select 1 from capture.researcher r
    where r.user_id=nullif(current_setting('capture.actor',true),'')::uuid and r.enabled));
create policy catalogue_rename on entities.catalogue for update to capture_writer
  using(exists(select 1 from capture.researcher r
    where r.user_id=nullif(current_setting('capture.actor',true),'')::uuid and r.enabled))
  with check(exists(select 1 from capture.researcher r
    where r.user_id=nullif(current_setting('capture.actor',true),'')::uuid and r.enabled));

commit;
