import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { cp, mkdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { runner, PG_MIGRATE_LOCK_ID } from 'node-pg-migrate';
import { withActorTransaction } from '../../apps/api/dist/database/actor-transaction.js';

const migrations = fileURLToPath(new URL('../../tests/database/migrations/', import.meta.url));
const id = (value) => `01900000-0000-7000-8000-${String(value).padStart(12, '0')}`;
const A = { eventId: id(1), userId: id(21) };
const A2 = { eventId: id(1), userId: id(22) };
const B = { eventId: id(2), userId: id(23) };
const silentLogger = { info() {}, warn() {}, error() {} }; // Never print SQL/credentials; errors still reject.

export async function verifyPersistence(config, expectedData, scratch) {
  assert.equal(config.host, '127.0.0.1');
  assert.equal(config.database, 'joinnr_pool_test');
  const base = {
    ...config,
    ssl: false,
    connectionTimeoutMillis: 5000,
    query_timeout: 6000,
    idleTimeoutMillis: 10000,
  };
  const admin = new pg.Pool({ ...base, max: 2, application_name: 'joinnr-migration-lab' });
  const poolErrors = [];
  admin.on('error', (error) => poolErrors.push(error));
  let reuse;
  let parallel;
  let phase = 'disposable identity';
  async function migrate(dir = migrations) {
    const client = new pg.Client({ ...base, application_name: 'joinnr-migration-lab' });
    await client.connect();
    try {
      return await runner({
        dbClient: client,
        dir,
        direction: 'up',
        migrationsTable: 'schema_migrations',
        migrationsSchema: 'pool_meta',
        createMigrationsSchema: true,
        schema: 'public',
        singleTransaction: true,
        checkOrder: true,
        noLock: false,
        advisoryLockMode: 'fail',
        logger: silentLogger,
      });
    } finally {
      await client.end();
    }
  }
  try {
    const location = (await admin.query('SHOW data_directory')).rows[0].data_directory;
    assert.equal(await realpath(location), await realpath(expectedData));
    const runtimePassword = randomBytes(32).toString('base64url');
    await admin.query('CREATE ROLE joinnr_pool_owner NOLOGIN NOSUPERUSER NOBYPASSRLS');
    const roleSql = (
      await admin.query(
        `SELECT format('CREATE ROLE joinnr_pool_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD %L', $1::text) AS sql`,
        [runtimePassword],
      )
    ).rows[0].sql;
    await admin.query(roleSql); // Server format(%L) quotes the generated secret; never logged.
    phase = 'migration bootstrap/replay';
    assert.equal((await migrate()).length, 2);
    assert.equal((await migrate()).length, 0);
    assert.equal(
      Number((await admin.query('SELECT count(*) FROM pool_meta.schema_migrations')).rows[0].count),
      2,
    );
    phase = 'migration lock exclusion';
    const lock = await admin.connect();
    try {
      await lock.query('SELECT pg_advisory_lock($1::bigint)', [String(PG_MIGRATE_LOCK_ID)]);
      await assert.rejects(migrate(), /Another migration is already running/);
    } finally {
      assert.equal(
        (
          await lock.query('SELECT pg_advisory_unlock($1::bigint) AS released', [
            String(PG_MIGRATE_LOCK_ID),
          ])
        ).rows[0].released,
        true,
      );
      lock.release();
    }
    phase = 'failed migration rollback';
    const failureDir = path.join(scratch, 'failing-migrations');
    await mkdir(failureDir);
    await cp(migrations, failureDir, { recursive: true });
    await writeFile(
      path.join(failureDir, '1760918400002_fault.sql'),
      '-- Up Migration\nCREATE TABLE pool_lab.must_rollback(id integer);\nSELECT 1/0;\n-- Down Migration\nDROP TABLE pool_lab.must_rollback;\n',
    );
    await assert.rejects(migrate(failureDir), (error) => error.code === '22012');
    assert.equal(
      (await admin.query(`SELECT to_regclass('pool_lab.must_rollback') AS name`)).rows[0].name,
      null,
    );
    assert.equal(
      Number((await admin.query('SELECT count(*) FROM pool_meta.schema_migrations')).rows[0].count),
      2,
    );
    assert.equal((await migrate()).length, 0); // Failure released the migration lock.
    console.log(
      'PASS: SQL migration bootstrap/replay, advisory-lock exclusion and failed-DDL/ledger rollback.',
    );

    await admin.query(
      `INSERT INTO pool_lab.memberships(event_id,id,user_id,active) VALUES ($1,$2,$3,true),($1,$4,$5,true),($6,$7,$8,true)`,
      [id(1), id(11), id(21), id(12), id(22), id(2), id(13), id(23)],
    );
    await admin.query(
      'INSERT INTO pool_lab.records(event_id,id,membership_id,version) SELECT event_id,id,id,1 FROM pool_lab.memberships',
    );
    await admin.query('INSERT INTO pool_lab.seats VALUES ($1,1,0)', [id(1)]);
    const runtime = {
      ...base,
      user: 'joinnr_pool_runtime',
      password: runtimePassword,
      application_name: 'joinnr-runtime-lab',
    };
    reuse = new pg.Pool({ ...runtime, max: 1 });
    parallel = new pg.Pool({ ...runtime, max: 2 });
    reuse.on('error', (error) => poolErrors.push(error));
    parallel.on('error', (error) => poolErrors.push(error));
    phase = 'runtime privileges and pool reuse';
    const role = (
      await reuse.query(
        `SELECT current_user AS name, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname=current_user`,
      )
    ).rows[0];
    assert.equal(role.name, 'joinnr_pool_runtime');
    for (const field of ['rolsuper', 'rolbypassrls', 'rolcreatedb', 'rolcreaterole'])
      assert.equal(role[field], false);
    assert.equal(
      (
        await reuse.query(
          `SELECT count(*) FROM pg_class WHERE relnamespace='pool_lab'::regnamespace AND relowner=(SELECT oid FROM pg_roles WHERE rolname=current_user)`,
        )
      ).rows[0].count,
      '0',
    );
    await assert.rejects(
      reuse.query('SELECT * FROM pool_meta.schema_migrations'),
      (error) => error.code === '42501',
    );
    await assert.rejects(
      reuse.query('DELETE FROM pool_meta.schema_migrations'),
      (error) => error.code === '42501',
    );
    assert.equal(
      (await reuse.query(`SELECT pg_has_role(current_user,'joinnr_pool_owner','member') AS member`))
        .rows[0].member,
      false,
    );
    const initialPid = (await reuse.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    async function assertClean() {
      const state = (
        await reuse.query(
          `SELECT pg_backend_pid() AS pid, nullif(current_setting('joinnr.actor_id',true),'') AS actor, nullif(current_setting('joinnr.event_id',true),'') AS event`,
        )
      ).rows[0];
      assert.equal(state.actor, null);
      assert.equal(state.event, null);
      assert.equal((await reuse.query('SELECT * FROM pool_lab.records')).rowCount, 0);
      return state.pid;
    }
    assert.equal(await assertClean(), initialPid);
    await withActorTransaction(reuse, A, async (tx) => {
      const rows = await tx.query('SELECT id,pg_backend_pid() AS pid FROM pool_lab.records');
      assert.equal(rows.rowCount, 1);
      assert.equal(rows.rows[0].id, id(11));
      assert.equal(rows.rows[0].pid, initialPid);
      assert.equal(
        (await tx.query('UPDATE pool_lab.records SET version=99 WHERE event_id=$1', [id(2)]))
          .rowCount,
        0,
      );
      await tx.query('UPDATE pool_lab.records SET version=2');
    });
    assert.equal(await assertClean(), initialPid);
    await assert.rejects(
      withActorTransaction(reuse, A, async (tx) => {
        await tx.query('UPDATE pool_lab.records SET version=9');
        throw new Error('Synthetic rollback');
      }),
      /Synthetic rollback/,
    );
    assert.equal(await assertClean(), initialPid);
    await assert.rejects(
      withActorTransaction(reuse, A, (tx) => tx.query('SELECT 1/0')),
      (error) => error.code === '22012',
    );
    assert.equal(await assertClean(), initialPid);
    assert.equal(
      (await admin.query('SELECT version FROM pool_lab.records WHERE id=$1', [id(11)])).rows[0]
        .version,
      2,
    );
    // Deliberately contaminate the session, then require the helper to overwrite
    // and clear it rather than merely relying on a fresh socket.
    await reuse.query(
      `SELECT set_config('joinnr.actor_id',$1,false), set_config('joinnr.event_id',$2,false)`,
      [A.userId, A.eventId],
    );
    await withActorTransaction(reuse, B, async (tx) => {
      const rows = await tx.query('SELECT id,pg_backend_pid() AS pid FROM pool_lab.records');
      assert.equal(rows.rowCount, 1);
      assert.equal(rows.rows[0].id, id(13));
      assert.equal(rows.rows[0].pid, initialPid);
    });
    assert.equal(await assertClean(), initialPid);
    await withActorTransaction(reuse, { ...A, eventId: B.eventId }, async (tx) =>
      assert.equal((await tx.query('SELECT * FROM pool_lab.records')).rowCount, 0),
    );
    await assert.rejects(
      withActorTransaction(reuse, A, (tx) =>
        tx.query('INSERT INTO pool_lab.records VALUES($1,$2,$3,1,null)', [id(2), id(99), id(13)]),
      ),
      (error) => error.code === '42501',
    );
    await assert.rejects(
      withActorTransaction(reuse, A, (tx) => tx.query('UPDATE pool_lab.seats SET capacity=100')),
      (error) => error.code === '42501',
    );
    await admin.query('UPDATE pool_lab.memberships SET active=false WHERE id=$1', [id(11)]);
    await withActorTransaction(reuse, A, async (tx) =>
      assert.equal((await tx.query('SELECT * FROM pool_lab.records')).rowCount, 0),
    );
    await admin.query('UPDATE pool_lab.memberships SET active=true WHERE id=$1', [id(11)]);
    assert.equal(await assertClean(), initialPid);
    phase = 'broken connection disposal';
    await assert.rejects(
      withActorTransaction(reuse, A, async (tx) => {
        const pid = (await tx.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
        await admin.query('SELECT pg_terminate_backend($1)', [pid]);
        await tx.query('SELECT 1');
      }),
    );
    assert.notEqual(await assertClean(), initialPid);
    console.log(
      'PASS: restricted LOGIN, same-backend pool reuse after commit/rollback/error, live revocation, cross-event/field denials and broken-connection disposal.',
    );

    // Hold the first mutation open, then prove the second backend is really blocked.
    async function overlap(first, second) {
      let release;
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      let signalFirst;
      const firstReady = new Promise((resolve) => {
        signalFirst = resolve;
      });
      let signalSecond;
      const secondReady = new Promise((resolve) => {
        signalSecond = resolve;
      });
      const firstRun = first(async () => {
        signalFirst();
        await gate;
      });
      firstRun.catch(() => signalFirst());
      await firstReady;
      let secondPid;
      const secondRun = second((pid) => {
        secondPid = pid;
        signalSecond();
      });
      secondRun.catch(() => signalSecond());
      try {
        await secondReady;
        const deadline = Date.now() + 1500;
        let blocked = false;
        while (Date.now() < deadline && secondPid) {
          blocked = (
            await admin.query('SELECT cardinality(pg_blocking_pids($1)) > 0 AS blocked', [
              secondPid,
            ])
          ).rows[0].blocked;
          if (blocked) break;
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        assert.equal(blocked, true, 'Second physical backend must contend on the first mutation');
      } finally {
        release();
      }
      return Promise.all([firstRun, secondRun]);
    }
    async function admit(actor, hold, starting) {
      return withActorTransaction(parallel, actor, async (tx) => {
        if (starting) starting((await tx.query('SELECT pg_backend_pid() AS pid')).rows[0].pid);
        const seat = (
          await tx.query(
            'SELECT admitted,capacity FROM pool_lab.seats WHERE event_id=$1 FOR UPDATE',
            [actor.eventId],
          )
        ).rows[0];
        if (seat.admitted >= seat.capacity) return 'full';
        await tx.query('UPDATE pool_lab.seats SET admitted=admitted+1 WHERE event_id=$1', [
          actor.eventId,
        ]);
        await tx.query('INSERT INTO pool_lab.admissions VALUES($1,$2)', [
          actor.eventId,
          actor.userId,
        ]);
        await tx.query('INSERT INTO pool_lab.outbox VALUES($1,$2)', [actor.eventId, actor.userId]);
        if (hold) await hold();
        return 'admitted';
      });
    }
    phase = 'last-seat contention';
    assert.deepEqual(
      await overlap(
        (hold) => admit(A, hold),
        (starting) => admit(A2, undefined, starting),
      ),
      ['admitted', 'full'],
    );
    assert.equal((await admin.query('SELECT admitted FROM pool_lab.seats')).rows[0].admitted, 1);
    assert.equal(
      (await admin.query('SELECT count(*) FROM pool_lab.admissions')).rows[0].count,
      '1',
    );
    assert.equal((await admin.query('SELECT count(*) FROM pool_lab.outbox')).rows[0].count, '1');
    phase = 'crossed-request contention';
    async function send(actor, sender, requestId, hold, starting) {
      return withActorTransaction(parallel, actor, async (tx) => {
        if (starting) starting((await tx.query('SELECT pg_backend_pid() AS pid')).rows[0].pid);
        await tx.query(
          `INSERT INTO pool_lab.requests(id,event_id,member_low,member_high,sender,status) VALUES($1,$2,$3,$4,$5,'pending') ON CONFLICT(event_id,member_low,member_high) WHERE status='pending' DO NOTHING`,
          [requestId, id(1), id(11), id(12), sender],
        );
        if (hold) await hold();
        return (await tx.query('SELECT id,sender,status FROM pool_lab.requests')).rows[0];
      });
    }
    const requests = await overlap(
      (hold) => send(A, id(11), id(101), hold),
      (starting) => send(A2, id(12), id(102), undefined, starting),
    );
    assert.deepEqual(requests[0], { id: id(101), sender: id(11), status: 'pending' });
    assert.deepEqual(requests[1], requests[0]);
    assert.equal((await admin.query('SELECT count(*) FROM pool_lab.requests')).rows[0].count, '1');
    phase = 'optimistic version contention';
    async function edit(hold, starting) {
      return withActorTransaction(parallel, A, async (tx) => {
        if (starting) starting((await tx.query('SELECT pg_backend_pid() AS pid')).rows[0].pid);
        const changed = await tx.query(
          'UPDATE pool_lab.records SET version=version+1 WHERE id=$1 AND version=2',
          [id(11)],
        );
        if (hold) await hold();
        return changed.rowCount;
      });
    }
    assert.deepEqual(
      await overlap(
        (hold) => edit(hold),
        (starting) => edit(undefined, starting),
      ),
      [1, 0],
    );
    assert.equal(
      (await admin.query('SELECT version FROM pool_lab.records WHERE id=$1', [id(11)])).rows[0]
        .version,
      3,
    );
    assert.equal(poolErrors.length, 0);
    console.log(
      'PASS: observed physical lock contention for last-seat capacity/outbox, crossed pending requests and stale-version updates.',
    );
  } catch (error) {
    const code = /^[A-Z0-9_]+$/.test(error.code ?? '') ? error.code : 'VERIFICATION_FAILED';
    throw new Error(
      `Persistence verification failed at ${phase} (${code}); private SQL and credentials withheld.`,
    );
  } finally {
    await Promise.all([reuse?.end(), parallel?.end(), admin.end()]);
  }
}
