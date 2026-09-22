begin;

alter table knowledge.claim_evidence add column evidence_mode text not null default 'excerpt'
  check(evidence_mode in ('excerpt','whole_document'));

-- Preserve the meaning of evidence imported before structured modes existed.
update knowledge.claim_evidence set evidence_mode='whole_document'
where locator ~* '^[[:space:]]*whole\y';

-- A capture acceptance records canonical references, not the shape of the form
-- or importer-local keys that happened to create them.
create table capture.acceptance (
  draft_id uuid primary key references capture.draft(id),
  name_evidence_id uuid references knowledge.claim_evidence(id),
  holder_evidence_id uuid references knowledge.claim_evidence(id),
  holder_name_evidence_id uuid references knowledge.claim_evidence(id),
  name_speaker_evidence_id uuid references knowledge.claim_evidence(id),
  holder_speaker_evidence_id uuid references knowledge.claim_evidence(id),
  identifier_id uuid references entities.external_identifier(id),
  catalogue_namespace text references entities.catalogue(namespace),
  accepted_at timestamptz not null default now()
);
alter table capture.acceptance enable row level security;
grant insert on capture.acceptance to capture_writer;
create policy capture_acceptance_insert on capture.acceptance for insert to capture_writer
  with check(exists(select 1 from capture.draft d where d.id=draft_id and d.owner_id=
    nullif(current_setting('capture.actor',true),'')::uuid));

-- Backfill every accepted draft, including incomplete research that is not
-- eligible for publication. Local keys are interpreted once at this boundary.
insert into capture.acceptance (
  draft_id, name_evidence_id, holder_evidence_id, holder_name_evidence_id,
  name_speaker_evidence_id, holder_speaker_evidence_id, identifier_id,
  catalogue_namespace, accepted_at
)
select d.id, n.claim_evidence_id, h.claim_evidence_id,
  coalesce(hn.claim_evidence_id, nullif(d.content->>'holderNameEvidenceId','')::uuid),
  case d.content->>'speakerMode'
    when 'holder' then coalesce(hn.claim_evidence_id, nullif(d.content->>'holderNameEvidenceId','')::uuid)
    when 'other' then coalesce(sn.claim_evidence_id, nullif(d.content->>'speakerNameEvidenceId','')::uuid) end,
  case d.content->>'speakerMode'
    when 'holder' then coalesce(hn.claim_evidence_id, nullif(d.content->>'holderNameEvidenceId','')::uuid)
    when 'other' then coalesce(sn.claim_evidence_id, nullif(d.content->>'speakerNameEvidenceId','')::uuid) end,
  i.id, i.namespace, d.updated_at
from capture.draft d
left join ingestion.dataset ds on ds.key='capture-'||d.id::text
left join ingestion.evidence_binding n on n.dataset_id=ds.id and n.local_key='evidence:name'
left join ingestion.evidence_binding h on h.dataset_id=ds.id and h.local_key='evidence:holder'
left join ingestion.evidence_binding hn on hn.dataset_id=ds.id and hn.local_key='evidence:holder-name'
left join ingestion.evidence_binding sn on sn.dataset_id=ds.id and sn.local_key='evidence:speaker-name'
left join entities.external_identifier i on i.entity_id=d.item_id
  and i.namespace=d.content->>'namespace' and i.value=d.content->>'identifier'
where d.status='accepted';

create or replace view capture.publication_candidate as
select a.draft_id, jsonb_build_object(
  'itemId', d.item_id,
  'name', a.name_evidence_id,
  'holder', a.holder_evidence_id,
  'holderName', a.holder_name_evidence_id,
  'nameSpeaker', a.name_speaker_evidence_id,
  'holderSpeaker', a.holder_speaker_evidence_id,
  'identifier', a.identifier_id,
  'catalogue', a.catalogue_namespace
) selection
from capture.acceptance a
join capture.draft d on d.id=a.draft_id and d.status='accepted'
join knowledge.claim_evidence ne on ne.id=a.name_evidence_id
join knowledge.claim nc on nc.id=ne.claim_id and nc.predicate='has_name'
where a.name_evidence_id is not null
  and a.holder_evidence_id is not null
  and a.holder_name_evidence_id is not null
  and a.name_speaker_evidence_id is not null
  and a.holder_speaker_evidence_id is not null
  and a.identifier_id is not null
  and a.catalogue_namespace is not null;

commit;
