import crypto from 'node:crypto';

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

export function extractKiwifyToken(req = {}) {
  const headers = req.headers || {};
  const authorization = firstNonEmpty(headers.authorization, headers.Authorization);
  const bearer = authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : '';
  return firstNonEmpty(
    headers['x-kiwify-token'],
    headers['X-Kiwify-Token'],
    bearer,
    req.query?.token,
    req.body?.token,
  );
}

export function isKiwifyTokenValid(received, expected) {
  const a = Buffer.from(String(received || ''));
  const b = Buffer.from(String(expected || ''));
  if (!a.length || !b.length || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function normalizeKiwifyEvent(payload = {}) {
  const customer = payload.Customer || payload.customer || payload.client || {};
  const product = payload.Product || payload.product || {};
  const eventId = firstNonEmpty(payload.id, payload.event_id, payload.eventId, payload.order_id, payload.orderId);
  const event = firstNonEmpty(payload.event, payload.type, payload.event_type, payload.status).toLowerCase();
  const email = firstNonEmpty(customer.email, payload.customer_email, payload.email).toLowerCase();
  const productId = firstNonEmpty(product.product_id, product.id, payload.product_id);
  const productName = firstNonEmpty(product.product_name, product.name, payload.product_name);
  return { eventId, event, email, productId, productName, raw: payload };
}

export function kiwifyEventAction(eventName) {
  const event = String(eventName || '').toLowerCase();
  if (['order_approved', 'purchase_approved', 'subscription_approved', 'subscription_renewed', 'recurring_payment_approved'].includes(event)) return 'activate';
  if (['subscription_canceled', 'subscription_cancelled', 'subscription_expired', 'order_refunded', 'refunded', 'chargeback', 'subscription_chargeback'].includes(event)) return 'deactivate';
  return 'ignore';
}
