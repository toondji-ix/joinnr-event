import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

// Coverage is a review report, never a claim that a contract has a working route.
const blueprint = await readFile(new URL('../docs/05-api.md', import.meta.url), 'utf8');
const document = parse(
  await readFile(new URL('../packages/contracts/openapi.yaml', import.meta.url), 'utf8'),
);
const rows = [...blueprint.matchAll(/^\|\s*(GET|POST|PUT|PATCH|DELETE)\s+`([^`]+)`([^|]*)\|/gm)];
if (rows.length === 0)
  throw new Error('No blueprint operations found; review parser before claiming coverage.');
const operations = rows.map(([, method, route, suffix]) => ({
  method,
  path: route,
  boundary: suffix.includes('(BFF)') ? 'bff' : 'domain-api',
  status: document.paths[route]?.[method.toLowerCase()] ? 'contract-only' : 'design-only',
}));
const keys = operations.map(({ method, path }) => `${method} ${path}`);
if (new Set(keys).size !== keys.length) throw new Error('Duplicate blueprint operation.');
const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);
for (const [route, item] of Object.entries(document.paths)) {
  for (const method of Object.keys(item).filter((entry) => methods.has(entry))) {
    if (!keys.includes(`${method.toUpperCase()} ${route}`))
      throw new Error(`Contract missing blueprint entry: ${method} ${route}`);
  }
}
const contracted = operations.filter(({ status }) => status === 'contract-only').length;
console.log(
  JSON.stringify(
    {
      blueprint_operations: operations.length,
      contracted_operations: contracted,
      design_only_operations: operations.length - contracted,
      note: 'This report does not inspect runtime routes or establish implementation evidence.',
      operations,
    },
    null,
    2,
  ),
);
// Report mode succeeds when inventory is valid; closure mode fails on missing contracts.
if (process.argv.length > 3 || (process.argv[2] && process.argv[2] !== '--require-complete')) {
  throw new Error('Usage: node scripts/contract-coverage.mjs [--require-complete]');
}
if (process.argv[2] === '--require-complete' && contracted !== operations.length)
  process.exitCode = 1;
