import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const [major, minor] = process.versions.node.split('.').map(Number);
let failures = 0;
console.log(`Node: ${process.versions.node}; required ${manifest.engines.node}`);
if (major !== 22 || minor < 13) failures++;

for (const tool of ['pnpm', 'git', 'docker']) {
  const command = process.platform === 'win32' && tool === 'pnpm' ? 'pnpm.cmd' : tool;
  const result = spawnSync(command, ['--version'], {
    encoding: 'utf8',
    shell: process.platform === 'win32' && tool === 'pnpm',
  });
  if (result.status === 0) {
    console.log(`${tool}: ${result.stdout.trim()}`);
    if (tool === 'pnpm' && result.stdout.trim() !== manifest.packageManager.split('@')[1])
      failures++;
  } else {
    console.log(
      `${tool}: unavailable${tool === 'docker' ? ' (needed only for local database)' : ''}`,
    );
    if (tool !== 'docker') failures++;
  }
}
process.exitCode = failures ? 1 : 0;
