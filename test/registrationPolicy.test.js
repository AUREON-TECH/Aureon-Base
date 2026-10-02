import test from 'node:test';
import assert from 'node:assert/strict';

const { registrationAllowed, defaultAccessStatus, publicProjectJoinAllowed } = await import('../src/registrationPolicy.js');

test('public registration accepts any valid email regardless of legacy allowlist', () => {
  assert.equal(registrationAllowed({
    mode: 'public',
    email: 'nova@exemplo.com',
    allowedEmails: ['outra@exemplo.com'],
  }), true);
});

test('closed registration rejects signup', () => {
  assert.equal(registrationAllowed({
    mode: 'closed',
    email: 'nova@exemplo.com',
    allowedEmails: [],
  }), false);
});

test('legacy registration preserves empty allowlist as open', () => {
  assert.equal(registrationAllowed({
    mode: 'legacy',
    email: 'nova@exemplo.com',
    allowedEmails: [],
  }), true);
});

test('legacy registration preserves allowlist restriction', () => {
  const allowedEmails = ['permitida@exemplo.com'];
  assert.equal(registrationAllowed({ mode: 'legacy', email: 'permitida@exemplo.com', allowedEmails }), true);
  assert.equal(registrationAllowed({ mode: 'legacy', email: 'outra@exemplo.com', allowedEmails }), false);
});

test('project lifetime default creates lifetime access', () => {
  assert.equal(defaultAccessStatus({
    registration_mode: 'public',
    default_access_status: 'lifetime',
  }, 'nova@exemplo.com', []), 'lifetime');
});

test('legacy lifetime email keeps lifetime access', () => {
  assert.equal(defaultAccessStatus({
    registration_mode: 'legacy',
    default_access_status: 'trialing',
  }, 'vip@exemplo.com', ['vip@exemplo.com']), 'lifetime');
});

test('legacy project otherwise keeps trialing access', () => {
  assert.equal(defaultAccessStatus({
    registration_mode: 'legacy',
    default_access_status: 'trialing',
  }, 'nova@exemplo.com', []), 'trialing');
});

test('public project join is allowed only for public registration mode', () => {
  assert.equal(publicProjectJoinAllowed({ registration_mode: 'public' }), true);
  assert.equal(publicProjectJoinAllowed({ registration_mode: 'legacy' }), false);
  assert.equal(publicProjectJoinAllowed({ registration_mode: 'closed' }), false);
});
