-- BorderoX registration in Aureon Base
-- Public e-mail/password registration; no e-mail confirmation is required by Aureon Base.

insert into projects(slug,name,trial_days,is_active)
values('borderox','BorderoX',90,true)
on conflict (slug) do update
set name=excluded.name,
    trial_days=excluded.trial_days,
    is_active=true;

insert into plans(project_id,code,name,price_cents,currency,interval,features)
select id,'early-access','BorderoX Early Access',0,'BRL','month',
       '{"bordero_reader":true,"commission_calculator":true,"history":true,"pwa":true}'::jsonb
from projects
where slug='borderox'
on conflict(project_id,code) do update
set name=excluded.name,
    price_cents=excluded.price_cents,
    features=excluded.features,
    is_active=true;
