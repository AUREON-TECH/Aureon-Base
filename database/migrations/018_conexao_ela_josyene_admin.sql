-- Josyene: administradora/embaixadora do Conexão Ela.
-- A senha não é armazenada em texto puro; somente o hash bcrypt.
with upsert_user as (
  insert into users(id,email,password_hash,is_active,is_superadmin)
  values(gen_random_uuid(),'josyeneembaixadora@gmail.com','$2a$12$spvp4SEqdWVCVCnwCZP.1.9dkS1cPvs7VOUHYrD8WYgVxZHHM1/Ei',true,false)
  on conflict(email) do update
    set password_hash=excluded.password_hash,
        is_active=true,
        updated_at=now()
  returning id
),
target_user as (
  select id from upsert_user
  union all
  select id from users where lower(email)='josyeneembaixadora@gmail.com'
  limit 1
),
target_project as (
  select id from projects where slug='barbara-life'
)
insert into project_users(project_id,user_id,role)
select p.id,u.id,'admin' from target_project p cross join target_user u
on conflict(project_id,user_id) do update set role='admin';

insert into subscriptions(project_id,user_id,status)
select p.id,u.id,'lifetime'
from projects p
join users u on lower(u.email)='josyeneembaixadora@gmail.com'
where p.slug='barbara-life'
on conflict(project_id,user_id) do update
set status='lifetime',trial_started_at=null,trial_ends_at=null,current_period_start=null,current_period_end=null,canceled_at=null,updated_at=now();

insert into project_access_requests(project_id,user_id,display_name,status,reviewed_by,reviewed_at)
select p.id,u.id,'Josyene','approved',u.id,now()
from projects p
join users u on lower(u.email)='josyeneembaixadora@gmail.com'
where p.slug='barbara-life'
on conflict(project_id,user_id) do update
set display_name='Josyene',status='approved',reviewed_by=excluded.reviewed_by,reviewed_at=now(),updated_at=now();
