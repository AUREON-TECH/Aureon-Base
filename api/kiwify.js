import crypto from 'node:crypto';
import { query, withTransaction } from '../src/db.js';
import { extractKiwifyToken, isKiwifyTokenValid, normalizeKiwifyEvent, kiwifyEventAction } from '../src/kiwifyWebhook.js';

function stableEventId(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload || {})).digest('hex');
}

async function activatePro(transactionQuery, email) {
  const found = await transactionQuery(`
    select u.id as user_id,p.id as project_id,pl.id as plan_id
    from users u
    join projects p on p.slug='tradevision' and p.is_active=true
    join project_users pu on pu.project_id=p.id and pu.user_id=u.id
    join plans pl on pl.project_id=p.id and pl.code='pro-monthly' and pl.is_active=true
    where lower(u.email)=lower($1) and u.is_active=true
    limit 1
  `, [email]);
  const row = found.rows[0];
  if (!row) return false;
  await transactionQuery(`
    insert into subscriptions(project_id,user_id,plan_id,status,current_period_end)
    values($1,$2,$3,'active',now()+interval '1 month')
    on conflict(project_id,user_id) do update set
      plan_id=excluded.plan_id,
      status='active',
      trial_started_at=null,
      trial_ends_at=null,
      current_period_end=excluded.current_period_end,
      updated_at=now()
  `, [row.project_id, row.user_id, row.plan_id]);
  return true;
}

async function downgradeToFree(transactionQuery, email) {
  const found = await transactionQuery(`
    select u.id as user_id,p.id as project_id,pl.id as plan_id
    from users u
    join projects p on p.slug='tradevision' and p.is_active=true
    join project_users pu on pu.project_id=p.id and pu.user_id=u.id
    join plans pl on pl.project_id=p.id and pl.code='free' and pl.is_active=true
    where lower(u.email)=lower($1) and u.is_active=true
    limit 1
  `, [email]);
  const row = found.rows[0];
  if (!row) return false;
  await transactionQuery(`
    insert into subscriptions(project_id,user_id,plan_id,status,current_period_end)
    values($1,$2,$3,'active',null)
    on conflict(project_id,user_id) do update set
      plan_id=excluded.plan_id,
      status='active',
      trial_started_at=null,
      trial_ends_at=null,
      current_period_end=null,
      updated_at=now()
  `, [row.project_id, row.user_id, row.plan_id]);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const expectedToken = String(process.env.KIWIFY_WEBHOOK_TOKEN || '').trim();
  const receivedToken = extractKiwifyToken(req);
  if (!isKiwifyTokenValid(receivedToken, expectedToken)) return res.status(401).json({ error: 'invalid_webhook_token' });

  const normalized = normalizeKiwifyEvent(req.body || {});
  const action = kiwifyEventAction(normalized.event);
  const eventId = normalized.eventId || stableEventId(req.body || {});

  try {
    const result = await withTransaction(async transactionQuery => {
      const inserted = await transactionQuery(`
        insert into billing_webhook_events(provider,event_id,event_type,customer_email,product_id,product_name,action)
        values('kiwify',$1,$2,$3,$4,$5,$6)
        on conflict(provider,event_id) do nothing
        returning id
      `, [eventId, normalized.event || 'unknown', normalized.email || null, normalized.productId || null, normalized.productName || null, action]);

      if (!inserted.rows[0]) return { duplicate: true, action: 'duplicate', changed: false };
      if (action === 'ignore') return { duplicate: false, action, changed: false };
      if (!normalized.email) return { duplicate: false, action, changed: false, reason: 'missing_email' };
      if (normalized.productName && !/tradevision\s*pro/i.test(normalized.productName)) return { duplicate: false, action: 'ignore', changed: false, reason: 'other_product' };

      const changed = action === 'activate'
        ? await activatePro(transactionQuery, normalized.email)
        : await downgradeToFree(transactionQuery, normalized.email);
      return { duplicate: false, action, changed };
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error('kiwify_webhook_error', error?.message || error);
    return res.status(500).json({ error: 'internal_error' });
  }
}
