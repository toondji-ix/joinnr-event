import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  access,
  appendFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  statfs,
  unlink,
  writeFile,
} from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const suffix = process.platform === 'win32' ? '.exe' : '';
const tools = ['initdb', 'pg_ctl', 'psql', 'pg_dump', 'postgres'];
const candidates = [];
if (process.env.JOINNR_PG_BIN) {
  if (!path.isAbsolute(process.env.JOINNR_PG_BIN))
    throw new Error('JOINNR_PG_BIN must be absolute.');
  candidates.push(process.env.JOINNR_PG_BIN);
} else {
  candidates.push(...(process.env.PATH ?? '').split(path.delimiter).filter(Boolean));
  if (process.platform === 'win32') {
    const installed = path.join(process.env.ProgramFiles ?? 'C:\\Program Files', 'PostgreSQL');
    const versions = await readdir(installed).catch((error) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
    for (const version of versions.filter((value) => /^(17|18)$/.test(value)).sort())
      candidates.push(path.join(installed, version, 'bin'));
  }
}
let bin;
let installedVersion;
for (const candidate of candidates) {
  try {
    await Promise.all(tools.map((tool) => access(path.join(candidate, `${tool}${suffix}`))));
  } catch {
    continue;
  }
  const versions = tools.map((tool) =>
    spawnSync(path.join(candidate, `${tool}${suffix}`), ['--version'], {
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true,
    }),
  );
  const numbers = versions.map((result) => /\b(17|18)\.(\d+)\b/.exec(result.stdout ?? '')?.[0]);
  if (
    versions.every((result) => result.status === 0) &&
    numbers[0] &&
    numbers.every((value) => value === numbers[0])
  ) {
    bin = candidate;
    installedVersion = numbers[0];
    break;
  }
}
if (!bin)
  throw new Error(
    'Matching PostgreSQL 17/18 tools not found. Install them or set JOINNR_PG_BIN to their bin directory. No database tests ran.',
  );
const disk = await statfs(root);
if (disk.bavail * disk.bsize < 256 * 1024 * 1024)
  throw new Error(
    'At least 256 MiB free workspace space is required; 500 MiB or more is recommended. No cluster created.',
  );
const socket = net.createServer();
await new Promise((resolve, reject) => {
  socket.once('error', reject);
  socket.listen(0, '127.0.0.1', resolve);
});
const port = socket.address().port;
await new Promise((resolve, reject) =>
  socket.close((error) => (error ? reject(error) : resolve())),
);
const scratchRoot = path.join(root, '.local');
await mkdir(scratchRoot, { recursive: true, mode: 0o700 });
if ((await realpath(scratchRoot)) !== path.join(await realpath(root), '.local')) {
  throw new Error('The local scratch directory must not redirect outside this workspace.');
}
const scratch = await mkdtemp(path.join(scratchRoot, 'postgres-lab-'));
const data = path.join(scratch, 'data');
const passwordFile = path.join(scratch, 'bootstrap-password');
const password = randomBytes(32).toString('base64url');
const env = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.toUpperCase().startsWith('PG')),
);
const connectionEnv = {
  ...env,
  PGPASSWORD: password,
  PGCONNECT_TIMEOUT: '5',
  PGSSLMODE: 'disable',
  PGAPPNAME: 'joinnr-disposable-lab',
};
function command(tool, args, { input, connect = false, allowFailure = false } = {}) {
  const result = spawnSync(path.join(bin, `${tool}${suffix}`), args, {
    cwd: root,
    encoding: 'utf8',
    env: connect ? connectionEnv : env,
    input,
    timeout: 60000,
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
    // On Windows a daemon can inherit pipe handles even after pg_ctl exits.
    // The server has its own -l log file; never wait for inherited output pipes.
    stdio: tool === 'pg_ctl' && args.includes('start') ? 'ignore' : 'pipe',
  });
  if (!allowFailure && (result.error || result.status !== 0)) {
    const state = [...(result.stderr ?? '').matchAll(/ERROR:\s+([A-Z0-9]{5})\b/g)].at(-1)?.[1];
    throw new Error(
      `Native database stage failed (${tool}${state ? `, SQLSTATE ${state}` : ''}). Raw SQL, credentials and logs are not printed.`,
    );
  }
  return result;
}
const connection = ['-w', '-h', '127.0.0.1', '-p', String(port), '-U', 'joinnr_test_admin'];
function psql(database, sql) {
  return command(
    'psql',
    ['-X', ...connection, '-d', database, '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=sqlstate'],
    { input: sql, connect: true },
  ).stdout;
}
let mayBeRunning = false;
let failure;
try {
  await writeFile(passwordFile, `${password}\n`, { mode: 0o600 });
  command('initdb', [
    '-D',
    data,
    '-U',
    'joinnr_test_admin',
    '--pwfile',
    passwordFile,
    '--auth=scram-sha-256',
    '--encoding=UTF8',
    '--no-locale',
    '--wal-segsize=1',
  ]);
  await unlink(passwordFile);
  await appendFile(
    path.join(data, 'postgresql.conf'),
    `\n# Disposable synthetic lab only\nlisten_addresses = '127.0.0.1'\nport = ${port}\nunix_socket_directories = ''\nshared_buffers = '16MB'\nmax_connections = 10\nmin_wal_size = '8MB'\nmax_wal_size = '32MB'\n`,
  );
  mayBeRunning = true;
  command('pg_ctl', [
    '-D',
    data,
    '-l',
    path.join(scratch, 'server.log'),
    '-w',
    '-t',
    '30',
    'start',
  ]);
  const identity = command(
    'psql',
    ['-X', ...connection, '-d', 'postgres', '-At', '-c', 'SHOW data_directory'],
    { connect: true },
  ).stdout.trim();
  if ((await realpath(identity)) !== (await realpath(data)))
    throw new Error('Disposable server identity mismatch; no test databases created.');
  console.log(`Native PostgreSQL ${installedVersion}: isolated synthetic cluster ready.`);
  psql('postgres', 'CREATE DATABASE joinnr_isolation_test;');
  psql(
    'joinnr_isolation_test',
    await readFile(new URL('../tests/sql/isolation.sql', import.meta.url), 'utf8'),
  );
  console.log(
    'PASS: real PostgreSQL roles/RLS/cross-event/FK and commit/rollback/failed-transaction context assertions.',
  );
  const snapshot = command(
    'pg_dump',
    [...connection, '-d', 'joinnr_isolation_test', '--no-owner', '--no-privileges'],
    { connect: true },
  ).stdout;
  psql('postgres', 'CREATE DATABASE joinnr_restore_test;');
  psql('joinnr_restore_test', snapshot);
  psql(
    'joinnr_restore_test',
    await readFile(new URL('../tests/sql/restore.sql', import.meta.url), 'utf8'),
  );
  console.log(
    'PASS: real pg_dump/restore and synthetic post-snapshot deletion replay/idempotency.',
  );
  psql('postgres', 'CREATE DATABASE joinnr_pool_test;');
  const { verifyPersistence } = await import('./database/verify-persistence.mjs');
  await verifyPersistence(
    { host: '127.0.0.1', port, database: 'joinnr_pool_test', user: 'joinnr_test_admin', password },
    data,
    scratch,
  );
} catch (error) {
  failure = error;
} finally {
  try {
    await unlink(passwordFile).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
    if (mayBeRunning) {
      const status = command('pg_ctl', ['-D', data, 'status'], { allowFailure: true });
      if (status.status === 0)
        command('pg_ctl', ['-D', data, '-m', 'fast', '-w', '-t', '30', 'stop']);
      else if (status.status !== 3)
        throw new Error('Server shutdown cannot be confirmed; disposable directory retained.');
    }
    const resolved = await realpath(scratch);
    const parent = await realpath(scratchRoot);
    if (
      path.dirname(resolved) !== parent ||
      !/^postgres-lab-[A-Za-z0-9]+$/.test(path.basename(resolved)) ||
      (await lstat(scratch)).isSymbolicLink()
    )
      throw new Error('Unsafe disposable cleanup path; directory retained.');
    await rm(resolved, { recursive: true, maxRetries: 3, retryDelay: 100 });
    console.log('Disposable native cluster stopped and removed; installed service/data untouched.');
  } catch (error) {
    failure = failure
      ? new AggregateError([failure, error], 'Database verification and cleanup both failed.')
      : error;
  }
}
if (failure) throw failure;
