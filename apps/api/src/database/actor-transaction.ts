import type { Pool, PoolClient } from 'pg';

/** Supplied by trusted server authentication/authorization, never caller headers. */
export interface ActorContext {
  readonly userId: string;
  readonly eventId: string;
}
export type Transaction = Pick<PoolClient, 'query'>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clearContext = `SELECT set_config('joinnr.actor_id', '', false), set_config('joinnr.event_id', '', false)`;

/** One client per transaction; this helper grants no business permission. */
export async function withActorTransaction<T>(
  pool: Pool,
  actor: ActorContext,
  operation: (transaction: Transaction) => Promise<T>,
): Promise<T> {
  const { userId, eventId } = actor;
  if (!uuid.test(userId) || !uuid.test(eventId)) throw new Error('Invalid actor context');
  const client = await pool.connect();
  let inTransaction = false;
  let destroy = false;
  let failed = false;
  let failure: unknown;
  let connectionFailure: Error | undefined;
  const onConnectionError = (error: Error) => {
    connectionFailure = error;
    destroy = true;
  };
  client.on('error', onConnectionError);
  let result!: T;
  try {
    await client.query(clearContext);
    await client.query('BEGIN');
    inTransaction = true;
    await client.query(
      `SELECT set_config('joinnr.actor_id', $1, true), set_config('joinnr.event_id', $2, true), set_config('statement_timeout', '5000', true), set_config('lock_timeout', '2000', true)`,
      [userId, eventId],
    );
    result = await operation({ query: client.query.bind(client) });
    if (connectionFailure) throw connectionFailure;
    await client.query('COMMIT');
    inTransaction = false;
  } catch (error) {
    failed = true;
    failure = error;
    if (inTransaction) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        destroy = true;
        failure = new AggregateError([error, rollbackError], 'Transaction and rollback failed');
      }
    }
  } finally {
    if (!destroy) {
      try {
        await client.query(clearContext);
      } catch (cleanupError) {
        destroy = true;
        failure = failed
          ? new AggregateError([failure, cleanupError], 'Transaction context cleanup failed')
          : cleanupError;
        failed = true;
      }
    }
    client.removeListener('error', onConnectionError);
    if (destroy) client.release(new Error('Discarding unsafe database connection'));
    else client.release();
  }
  if (failed) throw failure;
  return result;
}
