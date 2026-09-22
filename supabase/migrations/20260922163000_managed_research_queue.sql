begin;
create extension if not exists pgmq;
select pgmq.create('research_jobs');
alter table capture.job add column message_id bigint;
create function capture.queue_job() returns trigger language plpgsql security definer
set search_path=pg_catalog as $$
declare receipt bigint;
begin
 if new.status='queued' and (tg_op='INSERT' or old.status is distinct from 'queued' or new.message_id is null) then
   if tg_op='UPDATE' and old.message_id is not null then perform pgmq.archive('research_jobs',old.message_id); end if;
   select pgmq.send('research_jobs',jsonb_build_object('jobId',new.id)) into receipt;
   update capture.job set message_id=receipt where id=new.id;
 end if;
 return new;
end $$;
revoke all on function capture.queue_job() from public;
create trigger research_job_queue after insert or update of status on capture.job for each row execute function capture.queue_job();
-- Transfer unfinished work without changing completed results.
update capture.job set status='queued' where status in ('queued','running');
create function capture.take_job() returns setof capture.job language plpgsql security definer
set search_path=pg_catalog as $$
declare m record; j capture.job;
begin
 select * into m from pgmq.read('research_jobs',180,1);
 if not found then return; end if;
 select * into j from capture.job where id=(m.message->>'jobId')::uuid for update;
 if not found or j.status not in ('queued','running') or j.message_id<>m.msg_id
    or not exists(select 1 from capture.researcher where user_id=j.owner_id and enabled) then
   perform pgmq.archive('research_jobs',m.msg_id); return;
 end if;
 if j.attempts>=3 then
   update capture.job set status='failed',error='Interrupted three times; retry explicitly.' where id=j.id;
   perform pgmq.archive('research_jobs',m.msg_id); return;
 end if;
 update capture.job set status='running',lease=gen_random_uuid(),lease_until=m.vt,attempts=attempts+1,error=null
 where id=j.id returning * into j;
 return next j;
end $$;
create function capture.ack_job(receipt bigint) returns void language sql security definer
set search_path=pg_catalog as $$ select pgmq.archive('research_jobs',receipt); $$;
revoke all on function capture.take_job(),capture.ack_job(bigint) from public,anon,authenticated,capture_writer;
grant execute on function capture.take_job(),capture.ack_job(bigint) to capture_worker;
commit;
