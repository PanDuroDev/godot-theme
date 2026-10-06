// End-to-end consumer test: pack the library, install the tarball in
// test/consumer (exactly as published), run its assertions. No network needed.
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const consumer = join(root, 'test', 'consumer');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const tmp = mkdtempSync(join(tmpdir(), 'godot-theme-'));
try {
  execSync(`npm pack --pack-destination "${tmp}"`, { cwd: root, stdio: 'pipe' });
  const tgz = join(tmp, `godot-theme-${version}.tgz`);
  execSync(`npm install --no-audit --no-fund --offline "${tgz}"`, { cwd: consumer, stdio: 'pipe' });
  execSync('node test.mjs', { cwd: consumer, stdio: 'inherit' });
  console.log('consumer OK');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
