import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse } from 'yaml';

const document = parse(
  await readFile(new URL('../packages/contracts/openapi.yaml', import.meta.url), 'utf8'),
);
const ajv = new Ajv2020({ strict: true, allErrors: true });
addFormats(ajv);
ajv.addFormat('iana-time-zone', {
  type: 'string',
  validate(value) {
    if (!/^[A-Za-z_]+(?:\/[A-Za-z0-9_+.-]+)*$/.test(value)) return false;
    try {
      new Intl.DateTimeFormat('en', { timeZone: value }).format(0);
      return true;
    } catch {
      return false;
    }
  },
});

// Rebase only local component references for strict standalone JSON Schema validation.
// Tests do not install a validator in the API or claim that authorization is enforced.
function rebase(value) {
  if (Array.isArray(value)) return value.map(rebase);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        key === '$ref' && typeof entry === 'string'
          ? entry.replace('#/components/schemas/', 'urn:joinnr:schema:')
          : rebase(entry),
      ]),
    );
  }
  return value;
}
for (const [name, schema] of Object.entries(document.components.schemas)) {
  ajv.addSchema({ ...rebase(schema), $id: `urn:joinnr:schema:${name}` });
}
function validator(name) {
  const validate = ajv.getSchema(`urn:joinnr:schema:${name}`);
  assert.ok(validate, `Missing schema ${name}`);
  return validate;
}
function accepts(name, value) {
  const validate = validator(name);
  assert.equal(validate(value), true, JSON.stringify(validate.errors));
}
function rejects(name, value) {
  assert.equal(validator(name)(value), false, `${name} unexpectedly accepted invalid input`);
}
const event = {
  title: 'Synthetic Conference',
  description: 'Contract test fixture only.',
  category: 'technology_conference',
  timezone: 'Africa/Lagos',
  starts_at: '2027-01-20T08:00:00Z',
  ends_at: '2027-01-20T17:00:00Z',
  admission_opens_at: '2027-01-13T08:00:00Z',
  admission_closes_at: '2027-01-20T12:00:00Z',
  networking_opens_at: '2027-01-13T08:00:00Z',
  networking_closes_at: '2027-01-27T17:00:00Z',
  capacity: 500,
  admission_mode: 'approval',
};

test('every component compiles under strict JSON Schema 2020-12', () => {
  for (const name of Object.keys(document.components.schemas)) validator(name);
});

const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);
const operations = Object.entries(document.paths).flatMap(([path, item]) =>
  Object.entries(item)
    .filter(([method]) => methods.has(method))
    .map(([method, operation]) => ({ path, method, operation })),
);
for (const { path, method, operation } of operations) {
  test(`${operation.operationId}: all documented request and success examples validate`, () => {
    const content = operation.requestBody?.content['application/json'];
    if (content) {
      const name = content.schema.$ref.split('/').at(-1);
      for (const example of Object.values(content.examples)) accepts(name, example.value);
    }
    for (const [status, response] of Object.entries(operation.responses)) {
      if (!/^2/.test(status)) continue;
      const body = response.content['application/json'];
      for (const example of Object.values(body.examples)) {
        accepts(body.schema.$ref.split('/').at(-1), example.value);
      }
    }
  });
  test(`${method.toUpperCase()} ${path}: authentication is explicit and success is non-cacheable`, () => {
    const expected = path === '/access/resolve' ? [] : [{ accessToken: [] }];
    assert.deepEqual(operation.security ?? document.security, expected);
    assert.ok(operation['x-authorization'].invariants.length);
    for (const [status, response] of Object.entries(operation.responses)) {
      if (/^2/.test(status)) {
        assert.equal(
          response.headers['Cache-Control'].$ref,
          path === '/access/resolve'
            ? '#/components/headers/NoStore'
            : '#/components/headers/PrivateNoStore',
        );
      }
    }
    assert.ok(operation.responses['429']);
  });
}

test('only access resolution is public and create mutations require idempotency', () => {
  assert.deepEqual(
    operations
      .filter(({ operation }) => (operation.security ?? document.security).length === 0)
      .map(({ path }) => path),
    ['/access/resolve'],
  );
  for (const path of ['/organizations', '/organizations/{oid}/events']) {
    assert.ok(
      document.paths[path].post.parameters.some(
        (parameter) => parameter.$ref === '#/components/parameters/IdempotencyKey',
      ),
    );
  }
});

test('related public profile read has live scope invariants and a closed private-data boundary', () => {
  const operation = document.paths['/events/{eid}/profiles/{mid}'].get;
  assert.ok(
    operation['x-authorization'].invariants.includes('live-recommendation-request-or-connection'),
  );
  assert.ok(operation['x-authorization'].invariants.includes('no-block-in-either-direction'));
  assert.ok(operation.responses['404']);
  const value = operation.responses['200'].content['application/json'].examples.synthetic.value;
  accepts('PublicProfileEnvelope', value);
  for (const field of [
    'email',
    'phone',
    'contacts',
    'private_goals',
    'style_answers',
    'user_id',
    'score',
  ]) {
    rejects('PublicProfileEnvelope', { data: { ...value.data, [field]: 'private' } });
  }
  rejects('PublicProfileEnvelope', { ...value, contacts: [] });
});

test('organization contract rejects role/owner injection and blank/oversized names', () => {
  accepts('OrganizationInput', { name: 'Synthetic Organization' });
  for (const value of [{}, { name: '' }, { name: '   ' }, { name: 'a'.repeat(161) }]) {
    rejects('OrganizationInput', value);
  }
  rejects('OrganizationInput', { name: 'Synthetic', role: 'owner' });
  rejects('OrganizationInput', { name: 'Synthetic', owner_user_id: 'actor-supplied' });
});

test('conference contract admits only the four MVP categories', () => {
  for (const category of [
    'technology_conference',
    'business_conference',
    'startup_summit',
    'corporate_networking',
  ])
    accepts('EventInput', { ...event, category });
  for (const category of ['wedding', 'concert', 'sports', 'festival', 'conference']) {
    rejects('EventInput', { ...event, category });
  }
});

test('event contract rejects privilege fields, null fields and missing windows', () => {
  for (const field of ['organization_id', 'status', 'admitted_count', 'created_by', 'role']) {
    rejects('EventInput', { ...event, [field]: 'caller-supplied' });
  }
  rejects('EventInput', { ...event, title: null });
  const missingWindow = { ...event };
  delete missingWindow.networking_closes_at;
  rejects('EventInput', missingWindow);
});

test('capacity and text bounds are enforced without coercing or stripping input', () => {
  for (const capacity of [1, 5000]) accepts('EventInput', { ...event, capacity });
  for (const capacity of [0, -1, 5001, 1.5, '500']) {
    rejects('EventInput', { ...event, capacity });
  }
  rejects('EventInput', { ...event, title: 'a'.repeat(161) });
  rejects('EventInput', { ...event, description: 'a'.repeat(4001) });
  rejects('EventInput', { ...event, description: '  ' });
});

test('time formats require named zones and valid canonical UTC instants', () => {
  accepts('EventInput', { ...event, timezone: 'UTC' });
  for (const timezone of ['Moon/Base', '+01:00', '']) {
    rejects('EventInput', { ...event, timezone });
  }
  for (const starts_at of ['not-a-date', '2027-02-30T08:00:00Z', '2027-01-20T08:00:00+01:00']) {
    rejects('EventInput', { ...event, starts_at });
  }
});

test('access contract accepts exactly one well-formed credential', () => {
  accepts('AccessResolutionInput', { join_code: 'AB23CD45' });
  accepts('AccessResolutionInput', { link_token: 'a'.repeat(22) });
  for (const value of [
    {},
    { join_code: 'AB23CD45', link_token: 'a'.repeat(22) },
    { join_code: 'ab23cd45' },
    { join_code: 'AB23CD4O' },
    { join_code: 'AB23CD4' },
    { join_code: 'AB23CD456' },
    { link_token: 'short' },
    { link_token: 'a'.repeat(129) },
    { join_code: 'AB23CD45', user_id: 'caller-supplied' },
  ])
    rejects('AccessResolutionInput', value);
});

test('public preview contract rejects attendee, contact and internal-state leakage', () => {
  const preview = structuredClone(
    document.paths['/access/resolve'].post.responses['200'].content['application/json'].examples
      .synthetic.value,
  );
  for (const field of ['members', 'email', 'phone', 'style_answers', 'admitted_count']) {
    const value = structuredClone(preview);
    value.data.event[field] = 'must-not-be-public';
    rejects('AccessResolutionEnvelope', value);
  }
  rejects('AccessResolutionEnvelope', { ...preview, link_token: 'credential-must-not-be-echoed' });
  preview.data.event.status = 'draft';
  rejects('AccessResolutionEnvelope', preview);
});

test('request creation rejects participant, state and contact injection', () => {
  const input = { target_mid: '01900000-0000-7000-8000-000000000004' };
  accepts('RequestInput', input);
  rejects('RequestInput', {});
  for (const [field, value] of Object.entries({
    sender_mid: input.target_mid,
    event_id: input.target_mid,
    status: 'accepted',
    contact_ids: [input.target_mid],
    user_id: input.target_mid,
    role: 'organizer',
  }))
    rejects('RequestInput', { ...input, [field]: value });
  for (const intro of ['', '  ', 'x'.repeat(241), null])
    rejects('RequestInput', { ...input, intro });
  rejects('RequestInput', { ...input, recommendation_id: 'guessed' });
});

test('request response projections exclude private fields at every object boundary', () => {
  const example =
    document.paths['/events/{eid}/requests'].post.responses['201'].content['application/json']
      .examples.synthetic.value;
  for (const field of [
    'email',
    'phone',
    'contact_ids',
    'style_answers',
    'private_goal',
    'user_id',
  ]) {
    for (const endpoint of ['sender', 'receiver']) {
      const value = structuredClone(example);
      value.data[endpoint][field] = 'private';
      rejects('PendingRequestEnvelope', value);
    }
    const value = structuredClone(example);
    value.data[field] = 'private';
    rejects('PendingRequestEnvelope', value);
  }
  for (const status of ['accepted', 'declined', 'withdrawn']) {
    const value = structuredClone(example);
    value.data.status = status;
    rejects('PendingRequestEnvelope', value);
  }
});

test('request transitions require scoped IDs, strong version and correct participant role', () => {
  const condition = document.components.parameters.IfMatch;
  assert.equal(condition.required, true);
  assert.equal(condition.in, 'header');
  const validate = ajv.compile(condition.schema);
  for (const value of ['"1"', '"9007199254740991"']) assert.equal(validate(value), true);
  for (const value of ['1', '"0"', '"01"', '*', 'W/"1"', '"1", "2"', '"-1"', '"1.5"']) {
    assert.equal(validate(value), false, value);
  }
  for (const action of ['accept', 'decline', 'withdraw']) {
    const operation = document.paths[`/events/{eid}/requests/{rid}/${action}`].post;
    assert.equal(operation.requestBody, undefined);
    const refs = operation.parameters.map((value) => value.$ref);
    for (const name of ['EventId', 'RequestId', 'IfMatch']) {
      assert.ok(refs.includes(`#/components/parameters/${name}`));
    }
    assert.equal(
      operation['x-authorization'].actor,
      action === 'withdraw' ? 'request-sender' : 'request-receiver',
    );
    for (const status of ['401', '403', '404', '409', '412', '428', '429', '503'])
      assert.ok(operation.responses[status]);
    assert.equal(operation.responses['200'].headers.ETag.$ref, '#/components/headers/ETag');
  }
});

test('acceptance returns only safe connection metadata and requires explicit retry safety', () => {
  const operation = document.paths['/events/{eid}/requests/{rid}/accept'].post;
  assert.ok(
    operation.parameters.some((value) => value.$ref === '#/components/parameters/IdempotencyKey'),
  );
  assert.ok(operation['x-authorization'].invariants.includes('no-automatic-contact-grants'));
  const example = operation.responses['200'].content['application/json'].examples.synthetic.value;
  for (const field of ['contacts', 'grants', 'email', 'phone', 'style_answers', 'peer_feedback']) {
    const value = structuredClone(example);
    value.data[field] = [];
    rejects('ConnectionEnvelope', value);
  }
  const invalid = structuredClone(example);
  invalid.data.status = 'ended';
  rejects('ConnectionEnvelope', invalid);
});

test('crossed sends remain pending and terminal transitions have distinct response schemas', () => {
  const create = document.paths['/events/{eid}/requests'].post;
  for (const status of ['200', '201']) {
    assert.equal(
      create.responses[status].content['application/json'].schema.$ref,
      '#/components/schemas/PendingRequestEnvelope',
    );
  }
  assert.ok(create['x-authorization'].invariants.includes('crossed-request-never-auto-accepts'));
  for (const [action, name] of [
    ['decline', 'DeclinedRequestEnvelope'],
    ['withdraw', 'WithdrawnRequestEnvelope'],
  ]) {
    const body =
      document.paths[`/events/{eid}/requests/{rid}/${action}`].post.responses['200'].content[
        'application/json'
      ];
    assert.equal(body.schema.$ref, `#/components/schemas/${name}`);
    const invalid = structuredClone(body.examples.synthetic.value);
    invalid.data.status = 'pending';
    rejects(name, invalid);
  }
});

test('profile interests are bounded, unique IDs with no consent or actor assignment', () => {
  const ids = [101, 102, 103].map(
    (id) => `01900000-0000-7000-8000-${String(id).padStart(12, '0')}`,
  );
  accepts('ProfileInterestsInput', { interest_ids: ids });
  for (const interest_ids of [
    [],
    ids.slice(0, 2),
    [...ids, ids[0]],
    ['invalid', ...ids],
    Array.from({ length: 11 }, (_, i) => `01900000-0000-7000-8000-${String(i).padStart(12, '0')}`),
  ]) {
    rejects('ProfileInterestsInput', { interest_ids });
  }
  for (const field of [
    'membership_id',
    'user_id',
    'event_id',
    'networking_enabled',
    'semantic_consent',
    'version',
  ]) {
    rejects('ProfileInterestsInput', { interest_ids: ids, [field]: true });
  }
});

test('goal input permits offer-only selection and rejects invalid fields/bounds', () => {
  const goal = {
    direction: 'offer',
    topic_id: '01900000-0000-7000-8000-000000000104',
    public_summary: 'Offer mentorship',
    priority: 1,
  };
  accepts('ProfileGoalsInput', { goals: [goal] });
  accepts('ProfileGoalsInput', { goals: [{ ...goal, detail: 'Author-only detail' }] });
  for (const patch of [
    { direction: 'both' },
    { topic_id: 'unknown' },
    { priority: 0 },
    { priority: 4 },
    { priority: '1' },
    { public_summary: ' ' },
    { public_summary: 'x'.repeat(161) },
    { detail: 'x'.repeat(241) },
    { email: 'private@example.test' },
  ]) {
    rejects('ProfileGoalsInput', { goals: [{ ...goal, ...patch }] });
  }
  rejects('ProfileGoalsInput', { goals: [] });
  rejects('ProfileGoalsInput', { goals: [goal, goal] });
  rejects('ProfileGoalsInput', { goals: [goal], role: 'organizer' });
});

test('self profile writes require profile preconditions and private response boundaries', () => {
  for (const [suffix, name] of [
    ['interests', 'ProfileInterestsEnvelope'],
    ['goals', 'ProfileGoalsEnvelope'],
  ]) {
    const operation = document.paths[`/events/{eid}/profile/${suffix}`].put;
    assert.equal(operation['x-authorization'].actor, 'active-self-member');
    assert.ok(
      operation.parameters.some(
        (parameter) => parameter.$ref === '#/components/parameters/IfMatch',
      ),
    );
    for (const status of ['401', '403', '404', '412', '428'])
      assert.ok(operation.responses[status]);
    assert.equal(operation.responses['200'].headers.ETag.$ref, '#/components/headers/ProfileETag');
    const example = operation.responses['200'].content['application/json'].examples.synthetic.value;
    for (const field of ['contacts', 'style_answers', 'peer_feedback', 'semantic_consent']) {
      const value = structuredClone(example);
      value.data[field] = [];
      rejects(name, value);
    }
  }
  const publicProfile = structuredClone(
    document.paths['/events/{eid}/requests'].post.responses['201'].content['application/json']
      .examples.synthetic.value.data.sender,
  );
  publicProfile.goals = [{ public_summary: 'Public', detail: 'Private' }];
  rejects('PublicProfile', publicProfile);
});

test('problem envelope requires safe correlation fields and rejects debug properties', () => {
  const problem = {
    type: 'urn:joinnr:problem:validation_failed',
    title: 'Validation failed',
    status: 422,
    code: 'validation_failed',
    request_id: '01900000-0000-7000-8000-000000000001',
    field_errors: [{ field: 'title', code: 'required' }],
  };
  accepts('Problem', problem);
  rejects('Problem', { ...problem, stack: 'internal stack' });
  rejects('Problem', { ...problem, sql: 'internal query' });
  rejects('Problem', { ...problem, request_id: 'not-a-uuid' });
  rejects('Problem', { ...problem, status: 200 });
  rejects('Problem', {
    ...problem,
    field_errors: [{ field: 'title', code: 'required', value: 'secret' }],
  });
});
