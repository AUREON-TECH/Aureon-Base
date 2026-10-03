import test from 'node:test';
import assert from 'node:assert/strict';
import {
  approvalRequired,
  normalizeApprovalName,
  pendingApprovalAccess,
} from '../src/projectApproval.js';

test('approval is enabled only when project requires it', () => {
  assert.equal(approvalRequired({ registration_approval_required: true }), true);
  assert.equal(approvalRequired({ registration_approval_required: false }), false);
  assert.equal(approvalRequired({}), false);
});

test('approval name is trimmed and bounded', () => {
  assert.equal(normalizeApprovalName('  Maria Silva  '), 'Maria Silva');
  assert.equal(normalizeApprovalName(''), '');
  assert.equal(normalizeApprovalName('a'.repeat(120)).length, 80);
});

test('pending approval access is explicitly denied with stable status', () => {
  assert.deepEqual(pendingApprovalAccess(), {
    allowed: false,
    status: 'pending_approval',
    reason: 'approval_required',
  });
});
