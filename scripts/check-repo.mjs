import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const skip = new Set([
  'node_modules',
  '.git',
  '.pnpm-store',
  '.next',
  '.expo',
  '.local',
  'dist',
  'coverage',
]);
const failures = [];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter((entry) => !skip.has(entry.name))
      .map(async (entry) => {
        const file = path.join(directory, entry.name);
        return entry.isDirectory() ? filesIn(file) : entry.isFile() ? [file] : [];
      }),
  );
  return nested.flat();
}

const files = await filesIn(root);
const manifests = [];
for (const file of files) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  if (relative.endsWith('package.json')) {
    const pkg = JSON.parse(await readFile(file, 'utf8'));
    manifests.push(pkg.name);
    if (!pkg.private) failures.push(`${relative}: workspace must be private`);
    for (const [name, version] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
      if (!/^(\d+\.\d+\.\d+|workspace:\*)$/.test(version))
        failures.push(`${relative}: unpinned dependency ${name}`);
      if (relative.startsWith('packages/') && !name.startsWith('@joinnr/'))
        failures.push(
          `${relative}: shared packages need dependency review before external packages`,
        );
      if (
        /^apps\/(web|mobile)\//.test(relative) &&
        /(@joinnr\/(api|worker)|@nestjs\/|@aws-sdk\/|pg$|prisma)/.test(name)
      )
        failures.push(`${relative}: server dependency in client`);
    }
  }
  if (file.endsWith('.md')) {
    const text = await readFile(file, 'utf8');
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      try {
        await stat(path.resolve(path.dirname(file), target.split('#')[0]));
      } catch {
        failures.push(`${relative}: broken local link ${target}`);
      }
    }
  }
  if (/\.(ts|tsx|mjs)$/.test(file) && /^(apps\/(web|mobile)|packages)\//.test(relative)) {
    const text = await readFile(file, 'utf8');
    if (/\bprocess\.env\b/.test(text) && relative.startsWith('packages/'))
      failures.push(`${relative}: shared package reads environment`);
    for (const match of text.matchAll(/(?:from\s*|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g)) {
      const target = match[1];
      if (target.startsWith('node:') && relative.startsWith('packages/'))
        failures.push(`${relative}: shared package imports Node builtin`);
      if (target.startsWith('.')) {
        const resolved = path
          .relative(root, path.resolve(path.dirname(file), target))
          .replaceAll('\\', '/');
        const ownRoot = relative.split('/').slice(0, 2).join('/') + '/';
        if (!resolved.startsWith(ownRoot))
          failures.push(`${relative}: cross-workspace relative import ${target}`);
      }
    }
  }
}
if (new Set(manifests).size !== manifests.length) failures.push('Duplicate workspace names');
if (manifests.length !== 8)
  failures.push(`Expected root plus seven workspaces, got ${manifests.length}`);
for (const failure of failures) console.error(failure);
console.log(
  `Repository checks: ${files.length} files, ${manifests.length} manifests, ${failures.length} errors.`,
);
process.exitCode = failures.length ? 1 : 0;
