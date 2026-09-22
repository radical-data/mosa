begin;
-- Keep the publisher projection restricted to complete name/holder cards.
-- Reused labels refer to existing evidence selected by the server at review.
-- No private interpretation, draft note or classification enters the export.
create or replace view capture.publication_candidate as
select d.id draft_id, jsonb_build_object(
  'itemId', d.item_id,
  'name', n.claim_evidence_id,
  'holder', h.claim_evidence_id,
  'holderName', coalesce(hn.claim_evidence_id, nullif(d.content->>'holderNameEvidenceId','')::uuid),
  'nameSpeaker', case d.content->>'speakerMode'
    when 'holder' then coalesce(hn.claim_evidence_id, nullif(d.content->>'holderNameEvidenceId','')::uuid)
    when 'other' then coalesce(sn.claim_evidence_id, nullif(d.content->>'speakerNameEvidenceId','')::uuid) end,
  'holderSpeaker', case d.content->>'speakerMode'
    when 'holder' then coalesce(hn.claim_evidence_id, nullif(d.content->>'holderNameEvidenceId','')::uuid)
    when 'other' then coalesce(sn.claim_evidence_id, nullif(d.content->>'speakerNameEvidenceId','')::uuid) end,
  'identifier', i.id
) selection
from capture.draft d
join ingestion.dataset ds on ds.key='capture-'||d.id::text
join ingestion.evidence_binding n on n.dataset_id=ds.id and n.local_key='evidence:name'
join knowledge.claim_evidence ne on ne.id=n.claim_evidence_id
join knowledge.claim nc on nc.id=ne.claim_id and nc.predicate='has_name'
join ingestion.evidence_binding h on h.dataset_id=ds.id and h.local_key='evidence:holder'
left join ingestion.evidence_binding hn on hn.dataset_id=ds.id and hn.local_key='evidence:holder-name'
left join ingestion.evidence_binding sn on sn.dataset_id=ds.id and sn.local_key='evidence:speaker-name'
join entities.external_identifier i on i.entity_id=d.item_id
  and i.namespace=d.content->>'namespace' and i.value=d.content->>'identifier'
where d.status='accepted'
  and coalesce(hn.claim_evidence_id, nullif(d.content->>'holderNameEvidenceId','')::uuid) is not null;
-- CREATE OR REPLACE retains the view's existing restricted grants.
commit;
