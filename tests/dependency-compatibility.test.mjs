import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const mobileRequire = createRequire(new URL('../apps/mobile/package.json', import.meta.url));
const expoRequire = createRequire(mobileRequire.resolve('expo/package.json'));
const pluginsRequire = createRequire(expoRequire.resolve('@expo/config-plugins/package.json'));
const xcodePath = pluginsRequire.resolve('xcode');
const xcodeRequire = createRequire(xcodePath);
const uuid = xcodeRequire('uuid');

test('Expo Xcode resolves the scoped fixed CommonJS UUID package', () => {
  assert.equal(xcodeRequire('uuid/package.json').version, '11.1.1');
  assert.equal(uuid.validate(uuid.v4()), true);
  // The advisory concerns undersized output buffers, not v4 alone.
  assert.throws(() => uuid.v5('synthetic', uuid.v5.DNS, new Uint8Array(1)), RangeError);
});

test('real Xcode parser, UUID generation and writer round-trip after upgrade', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'joinnr-xcode-'));
  try {
    const file = path.join(directory, 'project.pbxproj');
    await writeFile(
      file,
      '// !$*UTF8*$!\n{ archiveVersion = 1; classes = {}; objectVersion = 56; objects = {}; rootObject = AAAAAAAAAAAAAAAAAAAAAAAA; }\n',
    );
    const xcode = pluginsRequire('xcode');
    const project = xcode.project(file).parseSync();
    const ids = new Set();
    for (let index = 0; index < 100; index++) {
      const id = project.generateUuid();
      assert.match(id, /^[A-F0-9]{24}$/);
      assert.equal(ids.has(id), false);
      ids.add(id);
    }
    await writeFile(file, project.writeSync());
    const restored = xcode.project(file).parseSync();
    assert.equal(restored.hash.project.rootObject, 'AAAAAAAAAAAAAAAAAAAAAAAA');
    assert.deepEqual(Object.keys(restored.hash.project.objects), []);
  } finally {
    // mkdtemp produced this exact task-owned temporary directory; never a user project.
    assert.equal(path.dirname(directory), tmpdir());
    assert.ok(path.basename(directory).startsWith('joinnr-xcode-'));
    await rm(directory, { recursive: true, force: true });
  }
});
