import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { assessEventWindows, validateEventSchedule } from '../packages/domain/dist/index.js';

const schedule = {
  starts_at: '2027-01-20T08:00:00Z',
  ends_at: '2027-01-20T17:00:00Z',
  admission_opens_at: '2027-01-13T08:00:00Z',
  admission_closes_at: '2027-01-20T12:00:00Z',
  networking_opens_at: '2027-01-13T08:00:00Z',
  networking_closes_at: '2027-01-27T17:00:00Z',
};

test('documented create-event example satisfies domain schedule rules', async () => {
  const spec = parse(
    await readFile(new URL('../packages/contracts/openapi.yaml', import.meta.url), 'utf8'),
  );
  const operation = spec.paths['/organizations/{oid}/events'].post;
  const examples = operation.requestBody.content['application/json'].examples;
  assert.ok(Object.keys(examples).length);
  for (const example of Object.values(examples))
    assert.deepEqual(validateEventSchedule(example.value), []);
});

test('physical, admission and networking ranges must be strictly increasing', () => {
  for (const [open, close] of [
    ['starts_at', 'ends_at'],
    ['admission_opens_at', 'admission_closes_at'],
    ['networking_opens_at', 'networking_closes_at'],
  ]) {
    for (const value of [schedule[open], '2026-01-01T00:00:00Z']) {
      assert.ok(
        validateEventSchedule({ ...schedule, [close]: value }).some(
          (issue) => issue.field === close && issue.code === 'MUST_BE_AFTER',
        ),
      );
    }
  }
});

test('admission and physical end cannot exceed networking close; equality is allowed', () => {
  for (const field of ['ends_at', 'admission_closes_at']) {
    assert.deepEqual(
      validateEventSchedule({ ...schedule, [field]: schedule.networking_closes_at }),
      [],
    );
    assert.ok(
      validateEventSchedule({ ...schedule, [field]: '2027-01-28T00:00:00Z' }).some(
        (issue) => issue.field === field && issue.code === 'MUST_NOT_BE_AFTER',
      ),
    );
  }
});

test('rejects impossible/noncanonical/offset dates and reports safe field codes only', () => {
  for (const value of [
    '2027-02-29T08:00:00Z',
    '2027-02-30T08:00:00Z',
    '2027-01-20T24:00:00Z',
    '2027-01-20T08:00:60Z',
    '2027-01-20T08:00:00+00:00',
    '2027-01-20',
    'secret-input',
    '',
    null,
    123,
  ]) {
    const issues = validateEventSchedule({ ...schedule, starts_at: value });
    assert.deepEqual(issues, [{ field: 'starts_at', code: 'INVALID_UTC_INSTANT' }]);
    if (value === 'secret-input') assert.equal(JSON.stringify(issues).includes(value), false);
  }
  assert.deepEqual(
    validateEventSchedule({
      ...schedule,
      starts_at: '2028-02-29T08:00:00Z',
      ends_at: '2028-02-29T17:00:00Z',
      networking_closes_at: '2028-03-01T00:00:00Z',
    }),
    [],
  );
});

test('inclusive opening/exclusive closing enforced even while stored status remains published', () => {
  for (const kind of ['admission', 'networking']) {
    const opening = schedule[`${kind}_opens_at`];
    const closing = schedule[`${kind}_closes_at`];
    assert.equal(
      assessEventWindows(schedule, 'published', '2026-01-01T00:00:00Z')[kind],
      'not_open',
    );
    assert.equal(assessEventWindows(schedule, 'published', opening)[kind], 'open');
    assert.equal(assessEventWindows(schedule, 'published', closing)[kind], 'closed');
    assert.equal(assessEventWindows(schedule, 'published', '2028-01-01T00:00:00Z')[kind], 'closed');
  }
});

test('nonpublished and unknown statuses never open a window; invalid inputs fail closed', () => {
  for (const status of ['draft', 'closed', 'cancelled', 'archived', 'unknown']) {
    assert.deepEqual(assessEventWindows(schedule, status, schedule.starts_at), {
      valid: true,
      admission: 'unavailable',
      networking: 'unavailable',
    });
  }
  assert.equal(assessEventWindows(schedule, 'published', 'invalid').valid, false);
  assert.equal(
    assessEventWindows(
      { ...schedule, ends_at: schedule.starts_at },
      'published',
      schedule.starts_at,
    ).valid,
    false,
  );
});

test('fractional seconds retain precision and equivalent encodings share a boundary', () => {
  const fractional = { ...schedule, admission_closes_at: '2027-01-20T12:00:00.0002Z' };
  assert.equal(
    assessEventWindows(fractional, 'published', '2027-01-20T12:00:00.0001Z').admission,
    'open',
  );
  assert.equal(
    assessEventWindows(fractional, 'published', '2027-01-20T12:00:00.00020Z').admission,
    'closed',
  );
  assert.ok(
    validateEventSchedule({ ...schedule, ends_at: '2027-01-20T08:00:00.000Z' }).some(
      (issue) => issue.code === 'MUST_BE_AFTER',
    ),
  );
});

test('opening and closing use absolute UTC instants across a daylight-saving transition', () => {
  const dst = {
    starts_at: '2027-03-14T06:30:00Z',
    ends_at: '2027-03-14T08:00:00Z',
    admission_opens_at: '2027-03-14T06:00:00Z',
    admission_closes_at: '2027-03-14T07:00:00Z',
    networking_opens_at: '2027-03-14T06:00:00Z',
    networking_closes_at: '2027-03-14T08:00:00Z',
  };
  assert.deepEqual(validateEventSchedule(dst), []);
  assert.deepEqual(assessEventWindows(dst, 'published', '2027-03-14T07:00:00Z'), {
    valid: true,
    admission: 'closed',
    networking: 'open',
  });
});
