import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { parseResourceVersion } from '../packages/domain/dist/index.js';

test('version parsing distinguishes absent precondition from malformed input', () => {
  assert.deepEqual(parseResourceVersion(undefined), { kind: 'missing' });
  for (const value of [
    null,
    1,
    ['"1"'],
    '',
    '1',
    '"0"',
    '"01"',
    '*',
    'W/"1"',
    '"1", "2"',
    ' "1" ',
    '"-1"',
    '"1.5"',
    '"1e3"',
    '"9007199254740992"',
    '"9999999999999999"',
  ]) {
    assert.deepEqual(parseResourceVersion(value), { kind: 'invalid' }, String(value));
  }
});
test('version parsing preserves every accepted safe-integer value exactly', () => {
  for (const version of [1, 2, 999999999999999, Number.MAX_SAFE_INTEGER]) {
    assert.deepEqual(parseResourceVersion(`"${version}"`), { kind: 'version', version });
  }
});
test('shared version parser implements the request header shape plus safe-integer bound', async () => {
  const document = parse(
    await readFile(new URL('../packages/contracts/openapi.yaml', import.meta.url), 'utf8'),
  );
  const shape = document.components.parameters.IfMatch.schema;
  const pattern = new RegExp(shape.pattern);
  for (const version of [1, 29, Number.MAX_SAFE_INTEGER]) {
    const value = `"${version}"`;
    assert.ok(pattern.test(value));
    assert.ok(value.length <= shape.maxLength);
    assert.equal(parseResourceVersion(value).kind, 'version');
  }
  // JSON Schema only describes lexical shape; the pure helper closes numeric overflow.
  assert.ok(pattern.test('"9007199254740992"'));
  assert.equal(parseResourceVersion('"9007199254740992"').kind, 'invalid');
});
