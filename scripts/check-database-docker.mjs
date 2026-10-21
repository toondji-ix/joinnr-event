import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// No arbitrary URL, database, SQL path or production credential is accepted.
if (process.argv.length !== 3 || process.argv[2] !== '--docker') {
  throw new Error('Use pnpm database:check --docker for the optional Docker lab.');
}
if (process.env.DOCKER_HOST || process.env.DOCKER_CONTEXT) {
  throw new Error('Unset Docker host/context overrides; this harness is local-only.');
}
const context = spawnSync(
  'docker',
  ['context', 'inspect', '--format', '{{json .Endpoints.docker.Host}}'],
  { encoding: 'utf8', timeout: 10000 },
);
if (context.error?.code === 'ENOENT') {
  console.error(
    'BLOCKED: Docker unavailable. No database tests ran. Install/start Docker with Compose v2, then rerun pnpm database:check.',
  );
  process.exit(1);
}
if (context.status !== 0 || !/^"(?:npipe:\/\/|unix:\/\/)/.test(context.stdout.trim())) {
  throw new Error('A local Docker socket/pipe context is required; no database tests ran.');
}
const composeVersion = spawnSync('docker', ['compose', 'version', '--short'], {
  encoding: 'utf8',
  timeout: 10000,
});
const composeMajor = Number((composeVersion.stdout ?? '').trim().replace(/^v/, '').split('.')[0]);
if (composeVersion.status !== 0 || !Number.isInteger(composeMajor) || composeMajor < 2) {
  throw new Error('Docker Compose v2 or newer is required; no database tests ran.');
}
const engine = spawnSync('docker', ['info', '--format', '{{.OSType}}'], {
  encoding: 'utf8',
  timeout: 10000,
});
if (engine.status !== 0 || engine.stdout.trim() !== 'linux') {
  throw new Error('Start the local Docker Linux-container engine; no database tests ran.');
}
const project = `joinnr-lab-${randomBytes(8).toString('hex')}`;
const compose = [
  'compose',
  '-f',
  fileURLToPath(new URL('../infra/local/compose.test.yaml', import.meta.url)),
  '-p',
  project,
];
const env = { ...process.env, JOINNR_TEST_DB_PASSWORD: randomBytes(32).toString('base64url') };
function docker(args, input, stage = args[0]) {
  const result = spawnSync('docker', [...compose, ...args], {
    encoding: 'utf8',
    input,
    env,
    timeout: 120000,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    // Do not emit environment values, dump contents or failed SQL.
    const state = [...(result.stderr ?? '').matchAll(/ERROR:\s+([A-Z0-9]{5})\b/g)].at(-1)?.[1];
    throw new Error(
      `Disposable database stage failed (${stage}${state ? `, SQLSTATE ${state}` : ''}); no verification success claimed.`,
    );
  }
  return result.stdout;
}
function psql(database, sql) {
  return docker(
    [
      'exec',
      '-T',
      'postgres',
      'psql',
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-v',
      'VERBOSITY=sqlstate',
      '-U',
      'joinnr_test_admin',
      '-d',
      database,
    ],
    sql,
    `psql ${database}`,
  );
}
let failure;
try {
  docker(['up', '-d', '--wait', '--wait-timeout', '90']);
  psql(
    'joinnr_isolation_test',
    await readFile(new URL('../tests/sql/isolation.sql', import.meta.url), 'utf8'),
  );
  console.log('PASS: synthetic PostgreSQL role/RLS/context/foreign-key assertions.');
  const snapshot = docker([
    'exec',
    '-T',
    'postgres',
    'pg_dump',
    '-U',
    'joinnr_test_admin',
    '-d',
    'joinnr_isolation_test',
    '--no-owner',
    '--no-privileges',
  ]);
  psql('joinnr_isolation_test', 'CREATE DATABASE joinnr_restore_test;');
  psql('joinnr_restore_test', snapshot);
  psql(
    'joinnr_restore_test',
    await readFile(new URL('../tests/sql/restore.sql', import.meta.url), 'utf8'),
  );
  console.log(
    'PASS: synthetic pg_dump restore and deletion replay. Not production recovery/RPO/RTO evidence.',
  );
} catch (error) {
  failure = error;
} finally {
  // Exact randomly generated project only; no existing local application volume.
  try {
    docker(['down', '--timeout', '10']);
  } catch (error) {
    failure = failure
      ? new AggregateError([failure, error], 'Database verification and cleanup both failed.')
      : error;
  }
}
if (failure) throw failure;
