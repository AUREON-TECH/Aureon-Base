begin;

create table if not exists billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  customer_email text,
  product_id text,
  product_name text,
  action text not null default 'ignore',
  processed_at timestamptz not null default now(),
  unique(provider, event_id)
);

create index if not exists billing_webhook_events_customer_email_idx
  on billing_webhook_events(customer_email, processed_at desc);

commit;
