export function registrationAllowed({ mode = 'legacy', email = '', allowedEmails = [] } = {}) {
  const normalizedMode = String(mode || 'legacy').trim().toLowerCase();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedAllowed = allowedEmails.map(value => String(value || '').trim().toLowerCase()).filter(Boolean);

  if (normalizedMode === 'public') return true;
  if (normalizedMode === 'closed') return false;
  return normalizedAllowed.length === 0 || normalizedAllowed.includes(normalizedEmail);
}

export function defaultAccessStatus(project = {}, email = '', lifetimeEmails = []) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedLifetime = lifetimeEmails.map(value => String(value || '').trim().toLowerCase()).filter(Boolean);
  if (project?.default_access_status === 'lifetime' || normalizedLifetime.includes(normalizedEmail)) return 'lifetime';
  return 'trialing';
}

export function publicProjectJoinAllowed(project = {}) {
  return String(project?.registration_mode || 'legacy').trim().toLowerCase() === 'public';
}
