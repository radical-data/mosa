begin;
-- Authentication alone is not research or publication authority. The explorer
-- reads through explorer_reader; capture writes only through its server login.
do $$ declare s text; begin
  foreach s in array array['entities','knowledge','provenance','restitution','presentation','ingestion'] loop
    execute format('revoke all on schema %I from anon, authenticated',s);
    execute format('revoke all on all tables in schema %I from anon, authenticated',s);
    execute format('revoke all on all functions in schema %I from public, anon, authenticated',s);
    execute format('alter default privileges in schema %I revoke all on tables from anon, authenticated',s);
  end loop;
end $$;

create schema capture;
revoke all on schema capture from public, anon, authenticated, explorer_reader;
create role capture_writer nologin;
grant explorer_reader to capture_writer;
grant usage on schema capture, ingestion to capture_writer;
create table capture.researcher (
  user_id uuid primary key,
  enabled boolean not null default true
);
create table capture.draft (
  id uuid primary key,
  owner_id uuid not null references capture.researcher(user_id),
  revision integer not null default 1 check(revision > 0),
  status text not null default 'draft' check(status in ('draft','review','deferred','rejected','accepted','deleted')),
  content jsonb not null check(jsonb_typeof(content)='object'),
  item_id uuid references entities.item(id),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,request_id),
  check((status='accepted')=(item_id is not null))
);
create index capture_draft_owner on capture.draft(owner_id,updated_at desc);
create index capture_draft_item on capture.draft(item_id);
create table capture.revision (
  draft_id uuid not null references capture.draft(id),
  revision integer not null,
  actor_id uuid not null references capture.researcher(user_id),
  status text not null,
  content jsonb not null,
  recorded_at timestamptz not null default now(),
  primary key(draft_id,revision)
);
alter table capture.researcher enable row level security;
alter table capture.draft enable row level security;
alter table capture.revision enable row level security;
grant select on capture.researcher to capture_writer;
grant select,insert,update on capture.draft to capture_writer;
grant select,insert on capture.revision to capture_writer;
create policy allowed_researchers on capture.researcher for select to capture_writer using(true);
create policy own_drafts on capture.draft to capture_writer
  using(owner_id=nullif(current_setting('capture.actor',true),'')::uuid
    and exists(select 1 from capture.researcher r where r.user_id=owner_id and r.enabled))
  with check(owner_id=nullif(current_setting('capture.actor',true),'')::uuid
    and exists(select 1 from capture.researcher r where r.user_id=owner_id and r.enabled));
create policy own_revisions on capture.revision to capture_writer
  using(exists(select 1 from capture.draft d where d.id=draft_id))
  with check(actor_id=nullif(current_setting('capture.actor',true),'')::uuid
    and exists(select 1 from capture.draft d where d.id=draft_id));

-- The service can insert canonical importer output, but cannot amend/delete
-- existing claims or manage researcher access or the publication ledger.
grant insert on entities.entity,entities.item,entities.agent,entities.source,entities.external_identifier,
  knowledge.claim,knowledge.claim_evidence to capture_writer;
grant select,insert,update on all tables in schema ingestion to capture_writer;
grant execute on function entities.create_item(text),entities.create_agent(text),entities.create_source(text,text,timestamptz) to capture_writer;
do $$ declare r record; begin
  for r in select * from (values
    ('entities','entity'),('entities','item'),('entities','agent'),('entities','source'),
    ('entities','external_identifier'),('knowledge','claim'),('knowledge','claim_evidence')) x(s,t) loop
    execute format('create policy capture_insert on %I.%I for insert to capture_writer with check(true)',r.s,r.t);
  end loop;
  for r in select tablename from pg_tables where schemaname='ingestion' loop
    execute format('create policy capture_import on ingestion.%I to capture_writer using(true) with check(true)',r.tablename);
  end loop;
end $$;
-- Maintainers can select accepted evidence without receiving draft notes or
-- broad access to ingestion bookkeeping. The view deliberately runs as owner.
create view capture.publication_candidate as
select d.id draft_id, jsonb_build_object(
  'itemId',d.item_id,
  'name',n.claim_evidence_id,
  'holder',h.claim_evidence_id,
  'holderName',hn.claim_evidence_id,
  'nameSpeaker',case d.content->>'speakerMode' when 'holder' then hn.claim_evidence_id when 'other' then sn.claim_evidence_id end,
  'holderSpeaker',case d.content->>'speakerMode' when 'holder' then hn.claim_evidence_id when 'other' then sn.claim_evidence_id end,
  'identifier',i.id
) selection
from capture.draft d
join ingestion.dataset ds on ds.key='capture-'||d.id::text
join ingestion.evidence_binding n on n.dataset_id=ds.id and n.local_key='evidence:name'
join ingestion.evidence_binding h on h.dataset_id=ds.id and h.local_key='evidence:holder'
join ingestion.evidence_binding hn on hn.dataset_id=ds.id and hn.local_key='evidence:holder-name'
left join ingestion.evidence_binding sn on sn.dataset_id=ds.id and sn.local_key='evidence:speaker-name'
join entities.external_identifier i on i.entity_id=d.item_id and i.namespace=d.content->>'namespace' and i.value=d.content->>'identifier'
where d.status='accepted';
revoke all on capture.publication_candidate from public, anon, authenticated, explorer_reader, capture_writer;
grant usage on schema capture to collection_publisher;
grant select on capture.publication_candidate to collection_publisher;
commit;
