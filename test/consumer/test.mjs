// Consumer-side verification: installed godot-theme must resolve + work via exports map.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.error('FAIL: ' + m); } else console.log('ok: ' + m); };

// 1. exports map resolves
const subs = ['godot-theme', 'godot-theme/tokens', 'godot-theme/tokens.json', 'godot-theme/tokens.js', 'godot-theme/base', 'godot-theme/components/button.css', 'godot-theme/js', 'godot-theme/icons/Play.svg', 'godot-theme/fonts/Inter_Regular.woff2'];
const paths = {};
for (const s of subs) {
  try { paths[s] = fileURLToPath(import.meta.resolve(s)); ok(true, 'resolves ' + s); }
  catch (e) { ok(false, `resolves ${s}: ${e.message}`); }
}

// 2. tokens usable from package
const { tokens } = await import('godot-theme/tokens.js');
ok(Object.keys(tokens).length === 38, `tokens.js has 38 tokens (got ${Object.keys(tokens).length})`);
ok(tokens.accent === '#569eff', 'accent token value');
const css = readFileSync(paths['godot-theme/tokens'], 'utf8');
ok(css.includes('--accent:#569eff'), 'tokens.css ships values');

// 3. JS + CSS entry surface
const js = readFileSync(paths['godot-theme/js'], 'utf8');
for (const fn of ['toast', 'openDialog', 'bindSearch', 'menu', 'closeMenu', 'ring', 'optMenu', 'tips']) {
  ok(js.includes(fn), 'godot.js exports ' + fn);
}
const root = join(dirname(paths['godot-theme']), '.');
ok(readFileSync(paths['godot-theme'], 'utf8').includes("tokens/tokens.css"), 'godot.css imports tokens');

// 4. assets ship in the tarball
for (const f of ['icons/Play.svg', 'icons/Godot.svg', 'icons/GuiChecked.svg', 'icons/godot/Add.svg', 'icons/manifest.json', 'godot.d.ts', 'tokens/tokens.d.ts', 'fonts/Inter_Regular.woff2', 'fonts/Inter_Bold.woff2', 'fonts/Vazirmatn_Regular.woff2', 'fonts/Vazirmatn_Bold.woff2', 'fonts/JetBrainsMono_Regular.woff2', 'fonts/LICENSE.Inter.txt', 'src/components/overlay.css']) {
  ok(existsSync(join(root, f)), 'ships ' + f);
}
const manifest = JSON.parse(readFileSync(join(root, 'icons/manifest.json'), 'utf8'));
ok(manifest.length === 1042, `manifest has 1042 entries (got ${manifest.length})`);

if (fail) process.exit(1);
console.log('CONSUMER OK');
