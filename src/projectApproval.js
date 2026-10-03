export function approvalRequired(project) {
  return project?.registration_approval_required === true;
}

export function normalizeApprovalName(value) {
  return String(value || '').trim().slice(0, 80);
}

export function pendingApprovalAccess() {
  return {
    allowed: false,
    status: 'pending_approval',
    reason: 'approval_required',
  };
}

export function rejectedApprovalAccess() {
  return {
    allowed: false,
    status: 'rejected',
    reason: 'approval_rejected',
  };
}
