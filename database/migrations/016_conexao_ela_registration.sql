alter table projects
  add column if not exists registration_mode text not null default 'legacy';

alter table projects
  add column if not exists default_access_status text not null default 'trialing';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_registration_mode_check'
  ) then
    alter table projects
      add constraint projects_registration_mode_check
      check (registration_mode in ('legacy','public','closed'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'projects_default_access_status_check'
  ) then
    alter table projects
      add constraint projects_default_access_status_check
      check (default_access_status in ('trialing','lifetime'));
  end if;
end
$$;

insert into projects(slug,name,trial_days)
values('barbara-life','Conexão Ela',0)
on conflict (slug) do nothing;

update projects
set name='Conexão Ela',
    registration_mode='public',
    default_access_status='lifetime',
    is_active=true
where slug='barbara-life';

insert into subscriptions(project_id,user_id,status)
select p.id,pu.user_id,'lifetime'
from projects p
join project_users pu on pu.project_id=p.id
where p.slug='barbara-life'
on conflict(project_id,user_id) do update
set status='lifetime',
    trial_started_at=null,
    trial_ends_at=null,
    current_period_start=null,
    current_period_end=null,
    canceled_at=null,
    updated_at=now();
