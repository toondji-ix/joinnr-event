import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const compiler = spawn(
  process.execPath,
  [require.resolve('typescript/bin/tsc'), '--watch', '--preserveWatchOutput'],
  { stdio: 'inherit' },
);
const server = spawn(process.execPath, ['--watch', 'dist/main.js'], { stdio: 'inherit' });
const children = [compiler, server];
let stopping = false;

function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}

for (const child of children) {
  child.on('error', () => stop(1));
  child.on('exit', (code) => stop(code ?? 1));
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
