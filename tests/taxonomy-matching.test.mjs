import assert from 'node:assert/strict';
import test from 'node:test';
import { rankTaxonomyCandidates } from '../packages/domain/dist/index.js';

const id = (index) => `01900000-0000-7000-8000-${String(index).padStart(12, '0')}`;
const topic = id(100);
function profile(index = 1, overrides = {}) {
  return {
    membership_id: id(index),
    event_id: id(20),
    account_active: true,
    membership_active: true,
    networking_enabled: true,
    profile_complete: true,
    profile_version: 1,
    current_profile_version: 1,
    interests: [id(30), id(31), id(32)],
    goals: [{ direction: 'seek', topic_id: topic }],
    ...overrides,
  };
}
function candidate(index = 2, overrides = {}) {
  return {
    profile: profile(index, { goals: [{ direction: 'offer', topic_id: topic }] }),
    blocked_either_direction: false,
    pending_request: false,
    connected_or_ended: false,
    cooldown_active: false,
    ...overrides,
  };
}
function input(candidates = [candidate()]) {
  return {
    actor: profile(),
    candidates,
    event_status: 'published',
    now: '2026-10-21T12:00:00Z',
    data_expires_at: '2026-11-01T00:00:00Z',
    schedule: {
      starts_at: '2026-10-21T10:00:00Z',
      ends_at: '2026-10-21T18:00:00Z',
      admission_opens_at: '2026-10-21T08:00:00Z',
      admission_closes_at: '2026-10-21T17:00:00Z',
      networking_opens_at: '2026-10-21T09:00:00Z',
      networking_closes_at: '2026-10-21T19:00:00Z',
    },
    configuration: {
      algorithm_version: 'synthetic-baseline-1',
      taxonomy_version: 'synthetic-topics-1',
      goal_weight: 2,
      interest_weight: 1,
      limit: 5,
      rules: [
        {
          source_topic_id: topic,
          source_direction: 'seek',
          target_topic_id: topic,
          target_direction: 'offer',
        },
        {
          source_topic_id: topic,
          source_direction: 'offer',
          target_topic_id: topic,
          target_direction: 'seek',
        },
      ],
    },
  };
}

test('structured reciprocal fit outranks shared-interest-only fit; inputs are immutable', () => {
  const value = input([candidate(3, { profile: profile(3) }), candidate()]);
  const original = structuredClone(value);
  const result = rankTaxonomyCandidates(value);
  assert.deepEqual(
    result.map((entry) => entry.membership_id),
    [id(2), id(3)],
  );
  assert.equal(result[0].score_internal, 1);
  assert.equal(result[1].score_internal, 1 / 3);
  assert.deepEqual(value, original);
  assert.equal(result[0].reasons.filter((reason) => reason.code === 'GOAL_FIT').length, 2);
  assert.equal(
    result[1].reasons.some((reason) => reason.code === 'GOAL_FIT'),
    false,
  );
});

test('self, cross-event, blocks, pending/ended pairs and cooldown are hard exclusions', () => {
  for (const changes of [
    { blocked_either_direction: true },
    { pending_request: true },
    { connected_or_ended: true },
    { cooldown_active: true },
    { blocked_either_direction: undefined },
    { profile: profile(1) },
    { profile: profile(2, { event_id: id(21) }) },
  ])
    assert.deepEqual(rankTaxonomyCandidates(input([candidate(2, changes)])), []);
});

test('both actor and candidate need active membership/account, opt-in and complete current profiles', () => {
  for (const changes of [
    { account_active: false },
    { membership_active: false },
    { networking_enabled: false },
    { profile_complete: false },
    { profile_version: 0 },
    { current_profile_version: 2 },
    { interests: [id(30)] },
    { interests: [id(30), id(30), id(31)] },
    { goals: [] },
    {
      goals: [
        { direction: 'seek', topic_id: topic },
        { direction: 'seek', topic_id: topic },
      ],
    },
  ]) {
    const value = input();
    value.actor = profile(1, changes);
    assert.deepEqual(rankTaxonomyCandidates(value), []);
    assert.deepEqual(
      rankTaxonomyCandidates(input([candidate(2, { profile: profile(2, changes) })])),
      [],
    );
  }
});

test('event cancellation, exact close and precise data expiry deny without a scheduler', () => {
  for (const event_status of ['draft', 'cancelled', 'closed', 'archived', 'unknown'])
    assert.deepEqual(rankTaxonomyCandidates({ ...input(), event_status }), []);
  const value = input();
  assert.deepEqual(
    rankTaxonomyCandidates({ ...value, now: value.schedule.networking_closes_at }),
    [],
  );
  value.data_expires_at = '2026-10-21T12:00:00.0001Z';
  assert.equal(rankTaxonomyCandidates(value).length, 1);
  assert.deepEqual(rankTaxonomyCandidates({ ...value, now: value.data_expires_at }), []);
  assert.deepEqual(rankTaxonomyCandidates({ ...value, now: '2026-02-30T12:00:00Z' }), []);
});

test('no cross-event filler or recommendations with no supported shared or reciprocal fact', () => {
  const unrelated = profile(2, {
    interests: [id(40), id(41), id(42)],
    goals: [{ direction: 'seek', topic_id: id(101) }],
  });
  assert.deepEqual(rankTaxonomyCandidates(input([candidate(2, { profile: unrelated })])), []);
  assert.deepEqual(rankTaxonomyCandidates(input([])), []);
  const oneWay = input([
    candidate(2, { profile: { ...unrelated, goals: [{ direction: 'offer', topic_id: topic }] } }),
  ]);
  oneWay.configuration.rules.pop();
  assert.deepEqual(rankTaxonomyCandidates(oneWay), []);
});

test('ambiguous duplicate candidate snapshots fail closed regardless of ordering', () => {
  const original = candidate();
  const blocked = candidate(2, { blocked_either_direction: true });
  for (const candidates of [
    [original, blocked],
    [blocked, original],
  ])
    assert.deepEqual(rankTaxonomyCandidates(input(candidates)), []);
});

test('deterministic tie ordering and a bounded shortlist preserve factual reason references', () => {
  const candidates = [9, 8, 7, 6, 5, 4, 3, 2].map((index) => candidate(index));
  const result = rankTaxonomyCandidates(input(candidates));
  assert.deepEqual(
    result.map((entry) => entry.membership_id),
    [2, 3, 4, 5, 6].map(id),
  );
  assert.deepEqual(rankTaxonomyCandidates(input([...candidates].reverse())), result);
  for (const match of result) {
    assert.deepEqual(Object.keys(match).sort(), ['membership_id', 'reasons', 'score_internal']);
    const shared = match.reasons.filter((reason) => reason.code === 'SHARED_INTEREST');
    assert.deepEqual(
      shared.map((reason) => reason.interest_id),
      [30, 31, 32].map(id),
    );
  }
});

test('invalid versioned ranking configuration never silently falls back', () => {
  for (const changes of [
    { goal_weight: 0 },
    { interest_weight: NaN },
    { goal_weight: Infinity },
    { limit: 0 },
    { limit: 6 },
    { limit: 1.5 },
    { algorithm_version: '' },
    { taxonomy_version: ' ' },
  ]) {
    const value = input();
    Object.assign(value.configuration, changes);
    assert.throws(() => rankTaxonomyCandidates(value), /Invalid matching configuration/);
  }
});
