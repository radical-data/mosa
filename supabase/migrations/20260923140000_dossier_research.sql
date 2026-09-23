begin;

-- Bind administrative records to their reviewed packet. A replay cannot
-- manufacture another case, action or document.
create table ingestion.record_binding (
  dataset_id uuid not null references ingestion.dataset(id),
  local_key text not null,
  record_kind text not null check (record_kind in ('case', 'action', 'document')),
  record_id uuid not null,
  primary key (dataset_id, local_key),
  unique (record_kind, record_id)
);
alter table ingestion.record_binding enable row level security;
grant select, insert on ingestion.record_binding to capture_writer;
create policy capture_import on ingestion.record_binding to capture_writer
  using (true) with check (true);

-- Publishers see only accepted packet content needed to construct a public
-- candidate, without opening private draft notes or the research queue.
create view capture.public_dossier_candidate as
select d.id draft_id,d.item_id,d.content->'packet' packet
from capture.draft d
where d.status='accepted' and d.content->>'kind'='dossier';
revoke all on capture.public_dossier_candidate from public,anon,authenticated,explorer_reader,capture_writer;
grant usage on schema capture,ingestion to collection_publisher;
grant select on capture.public_dossier_candidate to collection_publisher;
grant select on ingestion.dataset,ingestion.entity_binding,
  ingestion.claim_binding,ingestion.evidence_binding,ingestion.record_binding to collection_publisher;
create policy publisher_read on ingestion.record_binding for select to collection_publisher using(true);
do $$ declare r record; begin
  for r in select * from (values ('dataset'),('entity_binding'),('claim_binding'),('evidence_binding')) x(t) loop
    execute format('create policy publisher_read on ingestion.%I for select to collection_publisher using(true)',r.t);
  end loop;
end $$;

-- A reviewed dossier uses the same transaction and restricted writer as the
-- existing summary importer. The writer may add canonical facts, never change
-- previously accepted assertions or publication decisions.
grant insert on entities.place, provenance.event,
  restitution.case_record, restitution.case_item, restitution.case_party,
  restitution.case_action, restitution.action_party,
  restitution.case_document, restitution.action_document to capture_writer;
grant execute on function entities.create_place(text) to capture_writer;
do $$ declare r record; begin
  for r in select * from (values
    ('entities','place'),('provenance','event'),
    ('restitution','case_record'),('restitution','case_item'),
    ('restitution','case_party'),('restitution','case_action'),
    ('restitution','action_party'),('restitution','case_document'),
    ('restitution','action_document')) x(s,t) loop
    execute format('create policy capture_insert on %I.%I for insert to capture_writer with check(true)',r.s,r.t);
  end loop;
end $$;

commit;
