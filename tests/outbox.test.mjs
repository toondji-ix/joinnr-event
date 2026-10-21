import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const schema = JSON.parse(
  await readFile(new URL('../packages/contracts/outbox.schema.json', import.meta.url), 'utf8'),
);
const ajv = new Ajv2020({ strict: true, allErrors: true, allowUnionTypes: true });
addFormats(ajv);
const validate = ajv.compile(schema);
const fixture = {
  id: '01900000-0000-7000-8000-000000000001',
  type: 'request.created.v1',
  aggregate_type: 'request',
  aggregate_id: '01900000-0000-7000-8000-000000000002',
  aggregate_version: 1,
  event_id: '01900000-0000-7000-8000-000000000003',
  actor_pseudonym: 'synthetic_pseudonym_not_a_real_identity',
  occurred_at: '2027-01-20T09:00:00Z',
  correlation_id: '01900000-0000-7000-8000-000000000004',
};
test('all specified outbox types have explicit aggregate and scope', () => {
  const types = {
    'event.published.v1': 'event',
    'event.cancelled.v1': 'event',
    'membership.admitted.v1': 'membership',
    'profile.changed.v1': 'profile',
    'consent.withdrawn.v1': 'consent',
    'request.created.v1': 'request',
    'request.accepted.v1': 'request',
    'contact.revoked.v1': 'contact_grant',
    'user.erasure_requested.v1': 'user',
  };
  assert.deepEqual(Object.keys(types), schema.properties.type.enum);
  for (const [type, aggregate_type] of Object.entries(types)) {
    assert.equal(
      validate({
        ...fixture,
        type,
        aggregate_type,
        event_id: aggregate_type === 'user' ? null : fixture.event_id,
      }),
      true,
      JSON.stringify(validate.errors),
    );
  }
  assert.equal(
    validate({
      ...fixture,
      type: 'consent.withdrawn.v1',
      aggregate_type: 'consent',
      event_id: null,
    }),
    true,
  );
});
test('outbox rejects raw/private payloads instead of stripping them', () => {
  for (const key of [
    'payload',
    'email',
    'phone',
    'bio',
    'intro',
    'style_answers',
    'private_goal',
    'tokens',
    'contact_values',
  ]) {
    const value = { ...fixture, [key]: { value: 'must-not-enter-outbox' } };
    assert.equal(validate(value), false, key);
    assert.ok(Object.hasOwn(value, key));
  }
});
test('outbox rejects unknown versions, mismatched aggregates and missing event scope', () => {
  for (const patch of [
    { type: 'request.created.v2' },
    { aggregate_type: 'user' },
    { event_id: null },
    { aggregate_version: 0 },
    { aggregate_version: '1' },
    { aggregate_version: 1.5 },
    { occurred_at: '2027-01-20T10:00:00+01:00' },
    { occurred_at: 'not-a-date' },
    { correlation_id: 'not-a-uuid' },
    { actor_pseudonym: 'email@example.test' },
  ])
    assert.equal(validate({ ...fixture, ...patch }), false, JSON.stringify(patch));
  for (const key of schema.required) {
    const value = { ...fixture };
    delete value[key];
    assert.equal(validate(value), false, key);
  }
});
