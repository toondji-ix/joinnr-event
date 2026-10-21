import assert from 'node:assert/strict';
import test from 'node:test';
import { decideRequestTransition } from '../packages/domain/dist/index.js';

function snapshot(overrides = {}) {
  return {
    action: 'accept',
    actor_membership_id: 'receiver',
    event_id: 'event',
    expected_version: 3,
    pair_accessible: true,
    event_status: 'published',
    now: '2026-10-20T12:00:00Z',
    schedule: {
      starts_at: '2026-10-20T10:00:00Z',
      ends_at: '2026-10-20T18:00:00Z',
      admission_opens_at: '2026-10-20T08:00:00Z',
      admission_closes_at: '2026-10-20T17:00:00Z',
      networking_opens_at: '2026-10-20T09:00:00Z',
      networking_closes_at: '2026-10-20T19:00:00Z',
    },
    request: {
      event_id: 'event',
      sender_membership_id: 'sender',
      receiver_membership_id: 'receiver',
      status: 'pending',
      version: 3,
      expires_at: '2026-10-20T19:00:00Z',
    },
    ...overrides,
  };
}

test('only receiver accepts/declines and sender withdraws; acceptance grants no contacts', () => {
  for (const [action, actor, status] of [
    ['accept', 'receiver', 'accepted'],
    ['decline', 'receiver', 'declined'],
    ['withdraw', 'sender', 'withdrawn'],
  ]) {
    const input = snapshot({ action, actor_membership_id: actor });
    const original = structuredClone(input);
    assert.deepEqual(decideRequestTransition(input), {
      allowed: true,
      next_status: status,
      next_version: 4,
      create_connection: action === 'accept',
    });
    assert.deepEqual(input, original);
    for (const wrong of ['outsider', action === 'withdraw' ? 'receiver' : 'sender']) {
      assert.deepEqual(decideRequestTransition({ ...input, actor_membership_id: wrong }), {
        allowed: false,
        code: 'NOT_FOUND',
      });
    }
  }
});

test('inaccessible and cross-event records conceal terminal and version details', () => {
  for (const denial of [
    { pair_accessible: false },
    { event_id: 'other-event' },
    { actor_membership_id: 'staff' },
  ]) {
    const input = snapshot(denial);
    input.request.status = 'accepted';
    input.expected_version = 2;
    assert.deepEqual(decideRequestTransition(input), { allowed: false, code: 'NOT_FOUND' });
  }
});

test('terminal requests never transition again, including acceptance retries', () => {
  for (const status of ['accepted', 'declined', 'withdrawn', 'expired', 'unknown']) {
    const input = snapshot();
    input.request.status = status;
    assert.deepEqual(decideRequestTransition(input), { allowed: false, code: 'CONFLICT' });
  }
});

test('expiry is exclusive at full precision and independent of scheduler state', () => {
  const input = snapshot();
  input.request.expires_at = '2026-10-20T12:00:00.0001Z';
  assert.equal(decideRequestTransition(input).allowed, true);
  for (const now of [input.request.expires_at, '2026-10-20T12:00:00.0002Z']) {
    assert.deepEqual(decideRequestTransition({ ...input, now }), {
      allowed: false,
      code: 'CONFLICT',
    });
  }
});

test('event close, cancellation, draft and unknown states prevent all transitions', () => {
  for (const action of ['accept', 'decline', 'withdraw']) {
    const input = snapshot({
      action,
      actor_membership_id: action === 'withdraw' ? 'sender' : 'receiver',
    });
    for (const event_status of ['draft', 'cancelled', 'closed', 'archived', 'unknown']) {
      assert.deepEqual(decideRequestTransition({ ...input, event_status }), {
        allowed: false,
        code: 'CONFLICT',
      });
    }
    assert.deepEqual(
      decideRequestTransition({ ...input, now: input.schedule.networking_closes_at }),
      { allowed: false, code: 'CONFLICT' },
    );
  }
});

test('stale pending request rejects without producing a write plan', () => {
  assert.deepEqual(decideRequestTransition(snapshot({ expected_version: 2 })), {
    allowed: false,
    code: 'STALE_VERSION',
  });
});

test('invalid trusted snapshots fail closed without overflow or normalized dates', () => {
  for (const version of [0, -1, 1.5, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1]) {
    const input = snapshot();
    input.request.version = version;
    assert.deepEqual(decideRequestTransition(input), { allowed: false, code: 'INVALID_SNAPSHOT' });
  }
  for (const changes of [
    { now: '2026-02-30T12:00:00Z' },
    { expected_version: NaN },
    { action: 'unknown' },
  ]) {
    assert.deepEqual(decideRequestTransition(snapshot(changes)), {
      allowed: false,
      code: 'INVALID_SNAPSHOT',
    });
  }
  const input = snapshot();
  input.request.expires_at = 'invalid';
  assert.deepEqual(decideRequestTransition(input), { allowed: false, code: 'INVALID_SNAPSHOT' });
});
