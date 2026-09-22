begin;
alter table knowledge.claim_evidence add column source_version_id uuid references capture.source_version(id);
create index claim_evidence_source_version on knowledge.claim_evidence(source_version_id) where source_version_id is not null;
commit;
