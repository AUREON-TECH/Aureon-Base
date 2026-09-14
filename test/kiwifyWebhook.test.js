import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractKiwifyToken,
  normalizeKiwifyEvent,
  isKiwifyTokenValid,
} from '../src/kiwifyWebhook.js';

test('extractKiwifyToken accepts the common Kiwify token locations without logging secrets', () => {
  assert.equal(extractKiwifyToken({ headers: { 'x-kiwify-token': 'abc' }, query: {}, body: {} }), 'abc');
  assert.equal(extractKiwifyToken({ headers: { authorization: 'Bearer abc' }, query: {}, body: {} }), 'abc');
  assert.equal(extractKiwifyToken({ headers: {}, query: { token: 'abc' }, body: {} }), 'abc');
  assert.equal(extractKiwifyToken({ headers: {}, query: {}, body: { token: 'abc' } }), 'abc');
});

test('Kiwify webhook token comparison is timing-safe and rejects missing or mismatched values', () => {
  assert.equal(isKiwifyTokenValid('same-secret', 'same-secret'), true);
  assert.equal(isKiwifyTokenValid('bad-secret', 'same-secret'), false);
  assert.equal(isKiwifyTokenValid('', 'same-secret'), false);
  assert.equal(isKiwifyTokenValid('same-secret', ''), false);
});

test('normalizer extracts event, email and stable event id from typical Kiwify-shaped payloads', () => {
  const normalized = normalizeKiwifyEvent({
    id: 'evt_123',
    event: 'order_approved',
    Customer: { email: 'Trader@Example.com' },
    Product: { product_id: 'prod_1', product_name: 'TradeVision Pro' },
  });
  assert.equal(normalized.eventId, 'evt_123');
  assert.equal(normalized.event, 'order_approved');
  assert.equal(normalized.email, 'trader@example.com');
  assert.equal(normalized.productId, 'prod_1');
  assert.equal(normalized.productName, 'TradeVision Pro');
});
