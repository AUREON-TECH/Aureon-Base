import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCorsOrigins, isCorsOriginAllowed } from '../src/corsPolicy.js';

test('Conexão Ela GitHub Pages origin is allowed by default', () => {
  const origins = buildCorsOrigins('');
  assert.equal(origins.has('https://aureon-tech.github.io'), true);
  assert.equal(isCorsOriginAllowed('https://aureon-tech.github.io', origins), true);
});

test('legacy GitHub Pages origin remains allowed', () => {
  const origins = buildCorsOrigins('');
  assert.equal(isCorsOriginAllowed('https://raphaelbuenocaptacao-creator.github.io', origins), true);
});

test('unknown origins remain blocked unless explicitly configured', () => {
  const origins = buildCorsOrigins('');
  assert.equal(isCorsOriginAllowed('https://evil.example', origins), false);
});

test('configured origins are merged with built-ins', () => {
  const origins = buildCorsOrigins('https://custom.example, https://second.example');
  assert.equal(isCorsOriginAllowed('https://custom.example', origins), true);
  assert.equal(isCorsOriginAllowed('https://second.example', origins), true);
});

test('requests without an Origin header remain allowed for non-browser clients', () => {
  const origins = buildCorsOrigins('');
  assert.equal(isCorsOriginAllowed(undefined, origins), true);
});
