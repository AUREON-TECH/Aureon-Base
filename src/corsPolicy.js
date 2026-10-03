export const BUILT_IN_CORS_ORIGINS = [
  'https://raphaelbuenocaptacao-creator.github.io',
  'https://aureon-tech.github.io',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

export function buildCorsOrigins(configuredOrigins = '') {
  const configured = String(configuredOrigins || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  return new Set([...BUILT_IN_CORS_ORIGINS, ...configured]);
}

export function isCorsOriginAllowed(origin, origins) {
  if (!origin) return true;
  if (!(origins instanceof Set)) return false;
  return origins.has('*') || origins.has(origin);
}
