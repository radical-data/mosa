begin;
alter table capture.job drop constraint job_kind_check;
alter table capture.job add constraint job_kind_check check(kind in ('capture','prepare','discover'));
alter table capture.job alter column source_id drop not null;
alter table capture.job add column requests_used integer not null default 0 check(requests_used>=0);
alter table capture.job add column tokens_reserved integer not null default 0 check(tokens_reserved>=0);
alter table capture.job add constraint source_job_kind check((kind='discover' and source_id is null) or (kind<>'discover' and source_id is not null));
alter policy own_jobs on capture.job with check (
 owner_id=nullif(current_setting('capture.actor',true),'')::uuid
 and (kind='discover' and source_id is null or exists(select 1 from capture.source s where s.id=source_id))
);
grant insert on capture.job to capture_worker;
grant update(result) on capture.job to capture_writer;
create index job_lead on capture.job((input->>'leadId')) where input ? 'leadId';
commit;
