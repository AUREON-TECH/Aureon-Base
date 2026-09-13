import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const server = readFileSync(new URL('../src/server.js', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../database/migrations/015_tradevision_freemium.sql', import.meta.url), 'utf8');

test('TradeVision is explicitly configured for public signup without opening every project', () => {
  assert.match(server, /PUBLIC_SIGNUP_PROJECTS/);
  assert.match(server, /publicSignupProjects\.includes\(projectSlug\)/);
  assert.match(server, /allowedEmails\.length\s*&&\s*!publicSignupProjects\.includes\(projectSlug\)/);
});

test('new TradeVision users are enrolled into an active Free plan rather than a time-limited trial', () => {
  assert.match(server, /project\.slug\s*===\s*'tradevision'/);
  assert.match(server, /plan_code\s*=\s*'free'/);
  assert.match(server, /status[^\n]*'active'/);
});

test('TradeVision freemium migration defines permanent Free and Pro monthly plans', () => {
  assert.match(migration, /'free'\s*,\s*'TradeVision Free'\s*,\s*0/);
  assert.match(migration, /'pro-monthly'\s*,\s*'TradeVision Pro'\s*,\s*3990/);
  assert.match(migration, /operations_month[^\n]*20/);
});
