-- Run as a maintainer after configuring the app and two Vault secrets:
-- research_runner_url: the exact HTTPS /api/research-step URL
-- research_runner_token: the same random 32+ character RESEARCH_RUNNER_SECRET
-- Do not commit their values. This script does not start a separate service.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.schedule('mosa-research-step','* * * * *',$schedule$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='research_runner_url'),
    headers := jsonb_build_object('Content-Type','application/json','Authorization',
      'Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='research_runner_token')),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) where exists(select 1 from capture.job where status in ('queued','running'));
$schedule$);
