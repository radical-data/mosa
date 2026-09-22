begin;
-- Preserve historical job inputs/results and all drafts, sources and evidence.
-- Retire only this application's schedule and delivery queue.
do $$ begin
  if to_regclass('cron.job') is not null then
    perform cron.unschedule(jobid) from cron.job where jobname='mosa-research-step';
  end if;
end $$;
drop trigger research_job_queue on capture.job;
drop function capture.queue_job();
drop function capture.take_job();
drop function capture.ack_job(bigint);
update capture.job set status='paused',lease=null,lease_until=null,
  error='Hosted research retired. Continue locally and import a research bundle.'
  where status in ('queued','running');
select pgmq.drop_queue('research_jobs');
revoke insert,update on capture.job from capture_writer;
revoke all on all tables in schema capture from capture_worker;
revoke update(state) on capture.source_version from capture_worker;
revoke usage on schema capture from capture_worker;
revoke explorer_reader from capture_worker;
alter policy own_sources on capture.source to capture_writer;
alter policy own_versions on capture.source_version to capture_writer;
alter policy own_drafts on capture.draft to capture_writer;
alter policy own_revisions on capture.revision to capture_writer;
drop policy worker_researchers on capture.researcher;
drop policy worker_jobs on capture.job;
drop policy worker_draft_only on capture.draft;
drop policy worker_revision_only on capture.revision;
commit;
