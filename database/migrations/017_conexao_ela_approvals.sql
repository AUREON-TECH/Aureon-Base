alter table projects
  add column if not exists registration_approval_required boolean not null default false;

create table if not exists project_access_requests (
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  display_name text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(project_id,user_id)
);

create index if not exists idx_project_access_requests_status
  on project_access_requests(project_id,status,created_at desc);

update projects
set registration_approval_required=true
where slug='barbara-life';

update project_users pu
set role='admin'
from projects p, users u
where pu.project_id=p.id
  and pu.user_id=u.id
  and p.slug='barbara-life'
  and lower(u.email)='barbaraloiolalimasilva@gmail.com';
