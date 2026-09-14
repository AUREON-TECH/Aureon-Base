begin;

insert into plans(project_id,code,name,price_cents,currency,interval,features,is_active)
select id,'free','TradeVision Free',0,'BRL','month','{"operations_month":20,"core_dashboard":true,"history_read":true}'::jsonb,true
from projects
where slug='tradevision'
on conflict(project_id,code) do update set
  name=excluded.name,
  price_cents=excluded.price_cents,
  currency=excluded.currency,
  interval=excluded.interval,
  features=excluded.features,
  is_active=true;

insert into plans(project_id,code,name,price_cents,currency,interval,features,is_active)
select id,'pro-monthly','TradeVision Pro',3990,'BRL','month','{"operations_month":null,"analytics":true,"sync":true,"pwa":true,"history_full":true}'::jsonb,true
from projects
where slug='tradevision'
on conflict(project_id,code) do update set
  name=excluded.name,
  price_cents=excluded.price_cents,
  currency=excluded.currency,
  interval=excluded.interval,
  features=excluded.features,
  is_active=true;

commit;
