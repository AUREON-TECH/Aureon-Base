-- ASCEND: public, free, per-user personal growth PWA.
insert into projects(slug,name,trial_days,is_active,registration_mode,default_access_status)
values ('ascend','ASCEND — Eleve sua vida',0,true,'public','lifetime')
on conflict(slug) do update
set name=excluded.name,trial_days=0,is_active=true,registration_mode='public',default_access_status='lifetime';

insert into project_environments(project_id,name)
select p.id,e.name from projects p
cross join (values ('development'),('preview'),('production')) e(name)
where p.slug='ascend'
on conflict(project_id,name) do nothing;

insert into project_collections(project_id,name,owner_scoped,public_read)
select p.id,c.name,true,false from projects p
cross join (values
 ('profiles'),('priorities'),('dreams'),('tasks'),
 ('spiritual_journal'),('purposes'),('fasts'),('verse_favorites')
) c(name)
where p.slug='ascend'
on conflict(project_id,name) do update
set owner_scoped=true,public_read=false;

insert into project_domains(project_id,origin,is_active)
select id,'https://aureon-tech.github.io',true from projects where slug='ascend'
on conflict(project_id,origin) do update set is_active=true;
