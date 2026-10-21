import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const destination = new URL('../.env', import.meta.url);
const template = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
try {
  await writeFile(
    destination,
    `${template}\nPOSTGRES_PASSWORD=${randomBytes(32).toString('hex')}\n`,
    { flag: 'wx', mode: 0o600 },
  );
  console.log(
    'Created ignored .env with a random local database password. Values are not printed.',
  );
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('.env already exists; preserved without modification.');
}
