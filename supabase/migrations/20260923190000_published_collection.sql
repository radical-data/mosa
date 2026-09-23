begin;

-- Public pages read only this projection. Draft notes, preserved files and
-- unaccepted packets never enter it. Existing explicitly approved wording is
-- carried forward without embedding production research in the migration.
create table publication.published_record (
  item_id uuid primary key references entities.item(id),
  draft_id uuid references capture.draft(id),
  record jsonb not null check (jsonb_typeof(record) = 'object'
    and record->>'id' = item_id::text),
  published_at timestamptz not null default now(),
  visible boolean not null default true
);
create unique index published_record_draft_id on publication.published_record(draft_id)
  where draft_id is not null;

insert into publication.published_record(item_id,record)
select (entry.value->>'id')::uuid,entry.value
from publication.state s
join publication.release r on r.id=s.desired_release_id
cross join lateral jsonb_array_elements(r.snapshot->'records') entry
where s.singleton and r.approved_at is not null;

alter table publication.published_record enable row level security;
grant usage on schema publication to explorer_reader,capture_writer;
grant select on publication.published_record to explorer_reader;
grant insert(item_id,draft_id,record), update(draft_id,record,published_at)
  on publication.published_record to capture_writer;
grant select,update,delete on publication.published_record to collection_publisher;
create policy published_read on publication.published_record for select to explorer_reader
  using (true);
create policy researcher_publish on publication.published_record for insert to capture_writer
  with check (draft_id is not null and exists (
    select 1 from capture.draft d
    where d.id=published_record.draft_id
      and d.item_id=published_record.item_id and d.status='accepted'
      and d.owner_id=nullif(current_setting('capture.actor',true),'')::uuid
  ));
create policy researcher_replace on publication.published_record for update to capture_writer
  using (visible) with check (visible and draft_id is not null and exists (
    select 1 from capture.draft d
    where d.id=published_record.draft_id
      and d.item_id=published_record.item_id and d.status='accepted'
      and d.owner_id=nullif(current_setting('capture.actor',true),'')::uuid
  ));
create policy maintainer_visibility on publication.published_record
  for all to collection_publisher using (true) with check (true);

create table publication.record_action (
  id bigint generated always as identity primary key,
  item_id uuid not null,
  action text not null check (action in ('hide','clear')),
  actor text not null check (length(btrim(actor)) > 0),
  reason text not null check (length(btrim(reason)) > 0),
  recorded_at timestamptz not null default now()
);
create index record_action_item_id on publication.record_action(item_id);
alter table publication.record_action enable row level security;
grant select,insert on publication.record_action to collection_publisher;
grant usage on sequence publication.record_action_id_seq to collection_publisher;
create policy maintainer_action on publication.record_action to collection_publisher
  using (true) with check (true);

-- Only the accepted selection views are exposed to the restricted capture
-- writer. The legacy and dossier projectors validate the imported bindings.
grant select on capture.publication_candidate,capture.public_dossier_candidate
  to capture_writer;

commit;
