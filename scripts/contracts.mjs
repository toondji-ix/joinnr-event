import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createConfig, lint } from '@redocly/openapi-core';
import openapiTS, { astToString } from 'openapi-typescript';
import { format, resolveConfig } from 'prettier';
import { parse } from 'yaml';

const mode = process.argv[2];
if (!['--check', '--write'].includes(mode) || process.argv.length !== 3) {
  throw new Error('Usage: node scripts/contracts.mjs --check|--write');
}

const source = new URL('../packages/contracts/openapi.yaml', import.meta.url);
const destination = new URL('../packages/contracts/src/generated.ts', import.meta.url);
const document = parse(await readFile(source, 'utf8'));
function checkReferences(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if (key === '$ref' && (typeof entry !== 'string' || !entry.startsWith('#/components/'))) {
      throw new Error(
        'Contracts must use local component references; external file/URL refs are forbidden.',
      );
    }
    checkReferences(entry);
  }
}
checkReferences(document);
const config = await createConfig({
  extends: ['recommended'],
  // Private repository: do not invent a public software/API license declaration.
  rules: { 'info-license': 'off' },
});
const problems = await lint({ ref: fileURLToPath(source), config });
if (problems.length) {
  for (const problem of problems) console.error(`${problem.severity}: ${problem.message}`);
  throw new Error('OpenAPI lint failed. Resolve all reported errors and warnings.');
}

const ast = await openapiTS(source, { redocly: config });
const generated = await format(
  '// Generated from ../openapi.yaml. Run pnpm contracts:generate; do not edit.\n' +
    astToString(ast),
  { ...(await resolveConfig(fileURLToPath(destination))), parser: 'typescript' },
);
if (mode === '--write') {
  await writeFile(destination, generated);
  console.log('OpenAPI lint passed; regenerated client-safe TypeScript contracts.');
} else {
  const existing = await readFile(destination, 'utf8');
  if (existing !== generated) {
    throw new Error(
      'Generated contracts are stale. Run pnpm contracts:generate and review the diff.',
    );
  }
  console.log('OpenAPI lint passed; generated contracts match the source specification.');
}
