// No connection URL, database name or caller SQL is accepted.
if (process.argv.length > 3 || (process.argv[2] && process.argv[2] !== '--docker')) {
  throw new Error('Usage: node scripts/check-database.mjs [--docker]');
}
if (process.env.DOCKER_HOST || process.env.DOCKER_CONTEXT) {
  throw new Error('Unset Docker host/context overrides; this harness is local-only.');
}
const overrides = [
  'PGHOST',
  'PGHOSTADDR',
  'PGPORT',
  'PGDATABASE',
  'PGUSER',
  'PGPASSWORD',
  'PGPASSFILE',
  'PGSERVICE',
  'PGSERVICEFILE',
  'PGOPTIONS',
  'PGDATA',
];
if (overrides.some((name) => process.env[name])) {
  throw new Error(
    'Unset PostgreSQL connection/data overrides; this harness creates its own cluster.',
  );
}
if (process.argv[2] === '--docker') await import('./check-database-docker.mjs');
else await import('./check-database-native.mjs');
