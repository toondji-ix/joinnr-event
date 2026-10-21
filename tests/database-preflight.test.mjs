import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../scripts/check-database.mjs', import.meta.url));
function refuses(args, overrides, expected) {
  const result = spawnSync(process.execPath, [script, ...args], {
    env: { ...process.env, ...overrides },
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  const output = `${result.stdout}${result.stderr}`;
  assert.match(output, expected);
  assert.doesNotMatch(output, /PASS:|sensitive-test-host|sensitive-test-context/);
}
test('database runner refuses arbitrary connection arguments before starting any engine', () => {
  refuses(
    ['postgresql://sensitive-test-host/example'],
    {},
    /Usage: node scripts\/check-database.mjs/,
  );
});
test('database runner refuses remote host overrides without leaking their values', () => {
  refuses(
    [],
    { DOCKER_HOST: 'tcp://sensitive-test-host:2376', DOCKER_CONTEXT: '' },
    /Unset Docker host\/context overrides/,
  );
});
test('database runner refuses context overrides without leaking their values', () => {
  refuses(
    [],
    { DOCKER_HOST: '', DOCKER_CONTEXT: 'sensitive-test-context' },
    /Unset Docker host\/context overrides/,
  );
});

test('native runner refuses inherited connection and data overrides', () => {
  for (const name of ['PGHOST', 'PGSERVICE', 'PGOPTIONS', 'PGDATA', 'PGPASSWORD']) {
    refuses(
      [],
      { DOCKER_HOST: '', DOCKER_CONTEXT: '', [name]: 'sensitive-test-host' },
      /Unset PostgreSQL connection\/data overrides/,
    );
  }
});

test('native tool directory must be absolute and is never treated as a connection', () => {
  const env = Object.fromEntries(
    Object.keys(process.env)
      .filter((name) => name.toUpperCase().startsWith('PG'))
      .map((name) => [name, '']),
  );
  refuses(
    [],
    { ...env, DOCKER_HOST: '', DOCKER_CONTEXT: '', JOINNR_PG_BIN: './sensitive-test-host' },
    /JOINNR_PG_BIN must be absolute/,
  );
});
