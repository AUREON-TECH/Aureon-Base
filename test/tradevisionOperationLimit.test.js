import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const server = readFileSync(new URL('../src/server.js', import.meta.url), 'utf8');

test('subscription lookup exposes plan features for entitlement enforcement', () => {
  assert.match(server, /pl\.features\s+as\s+plan_features/i);
});

test('TradeVision Free enforces its monthly operation limit in the backend before insert', () => {
  assert.match(server, /monthly_operation_limit_reached/);
  assert.match(server, /date_trunc\('month',\s*created_at\)/i);
  assert.match(server, /operations_month/);
  assert.match(server, /used\s*>=\s*limit/);
});

test('monthly cap is checked under a transaction-scoped lock so concurrent writes cannot exceed the limit', () => {
  assert.match(server, /pg_advisory_xact_lock/i);
  assert.match(server, /withTransaction\(async\s+transactionQuery/);
});

test('an unlimited plan skips the monthly cap instead of inventing a large limit', () => {
  assert.match(server, /limit\s*===\s*null/);
  assert.match(server, /unlimited:\s*true/);
});

test('project access response includes current operation usage for the UI', () => {
  const accessRoute = server.match(/app\.get\('\/projects\/:slug\/access'[\s\S]*?\n\}\);/i)?.[0] || '';
  assert.match(accessRoute, /operationUsage/);
  assert.match(accessRoute, /usage/);
});

test('trading settings persist the validated snake_case values in parameter order', () => {
  assert.match(server, /values\.daily_stop\s*,\s*values\.daily_target\s*,\s*values\.base_contracts\s*,\s*values\.profit_step\s*,\s*values\.max_contracts/);
});
