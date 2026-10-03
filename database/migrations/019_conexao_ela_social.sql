-- Conexão Ela: identidade definitiva e base social
update projects set slug='conexao-ela', name='Conexão Ela', is_active=true
where slug='barbara-life' and not exists (select 1 from projects where slug='conexao-ela');

update projects set name='Conexão Ela', registration_mode='public', default_access_status='lifetime', registration_approval_required=true, is_active=true
where slug='conexao-ela';

insert into project_environments(project_id,name)
select p.id,e.name from projects p cross join (values('development'),('preview'),('production')) e(name)
where p.slug='conexao-ela' on conflict(project_id,name) do nothing;

insert into project_collections(project_id,name,owner_scoped,public_read)
select p.id,c.name,c.owner_scoped,c.public_read from projects p cross join (values
 ('profiles',true,false),('daily_goals',true,false),('mood_entries',true,false),
 ('long_goals',true,false),('diary_entries',true,false),('wellness_checkins',true,false),
 ('beauty_routines',true,false),('beauty_saved_tips',true,false),
 ('community_profiles',false,false),('community_posts',false,false),
 ('community_comments',false,false),('community_likes',false,false),
 ('community_messages',false,false),('events',false,false),('event_registrations',true,false)
) c(name,owner_scoped,public_read)
where p.slug='conexao-ela'
on conflict(project_id,name) do update set owner_scoped=excluded.owner_scoped, public_read=excluded.public_read;
