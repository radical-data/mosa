begin;
alter table capture.job drop constraint job_kind_check;
alter table capture.job add constraint job_kind_check check(kind in ('capture','prepare'));
-- One preparation per preserved version, shared by retries and repeated clicks.
create unique index job_preparation_version on capture.job(owner_id,(input->>'versionId')) where kind='prepare';
grant explorer_reader to capture_worker;
grant select,insert on capture.draft,capture.revision to capture_worker;
alter policy own_drafts on capture.draft to capture_writer,capture_worker;
alter policy own_revisions on capture.revision to capture_writer,capture_worker;
-- Worker may create drafts, never accepted rows or forged revision histories.
create policy worker_draft_only on capture.draft as restrictive for insert to capture_worker
with check(status='draft' and item_id is null and revision=1);
create policy worker_revision_only on capture.revision as restrictive for insert to capture_worker
with check(status='draft' and revision=1);
commit;
