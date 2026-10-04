-- Conexão Ela: garante Bárbara como administradora do projeto, sem privilégios globais.
insert into project_users(project_id,user_id,role)
select p.id,u.id,'admin'
from projects p join users u on lower(u.email)='barbaraloiolalimasilva@gmail.com'
where p.slug='conexao-ela'
on conflict(project_id,user_id) do update set role='admin';

insert into subscriptions(project_id,user_id,status)
select p.id,u.id,'lifetime'
from projects p join users u on lower(u.email)='barbaraloiolalimasilva@gmail.com'
where p.slug='conexao-ela'
on conflict(project_id,user_id) do update set status='lifetime',updated_at=now();

insert into project_access_requests(project_id,user_id,display_name,status,reviewed_by,reviewed_at)
select p.id,u.id,'Bárbara','approved',u.id,now()
from projects p join users u on lower(u.email)='barbaraloiolalimasilva@gmail.com'
where p.slug='conexao-ela'
on conflict(project_id,user_id) do update set status='approved',reviewed_at=now(),updated_at=now();
