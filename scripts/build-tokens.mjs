// Builds tokens/tokens.css + tokens/tokens.js from tokens/godot.json (node stdlib only).
// Usage: node scripts/build-tokens.mjs [--check]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'tokens', 'godot.json');
const cssOut = join(root, 'tokens', 'tokens.css');
const jsOut = join(root, 'tokens', 'tokens.js');
const dtsOut = join(root, 'tokens', 'tokens.d.ts');
const check = process.argv.includes('--check');

// Flat CSS var name per JSON path: color.btn-hover -> --btn-hover, font.size-base -> --font-size-base, etc.
const VAR_FIX = new Map([
  ['color', ''],
  ['radius.md', 'radius'],
  ['font.family', 'font'],
  ['font.mono', 'font-mono'],
  ['font.size-base', 'font-size'],
  ['font.size-title', 'title-size'],
  ['font.size-small', 'small-size'],
  ['font.size-tiny', 'tiny-size'],
  ['spacing.base', 'gap'],
  ['spacing.titlebar', 'titlebar-h'],
  ['spacing.row-icon', 'row-icon'],
  ['spacing.row-icon-compact', 'row-icon-sm'],
  ['spacing.sidebar', 'sidebar-w'],
]);

function walk(node, path = [], out = []) {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object' && '$value' in v) out.push({ path: [...path, k], value: v.$value, desc: v.$description || '' });
    else if (v && typeof v === 'object') walk(v, [...path, k], out);
  }
  return out;
}

const json = JSON.parse(readFileSync(src, 'utf8'));
const tokens = walk(json);
const varName = (path) => {
  const key = path.join('.');
  if (VAR_FIX.has(key)) return '--' + VAR_FIX.get(key);
  return '--' + path[path.length - 1];
};

let css = '/* AUTO-GENERATED from tokens/godot.json — do not edit. Run: npm run tokens:build */\n:root{\n';
for (const t of tokens) css += `  ${varName(t.path)}:${t.value};${t.desc ? ` /* ${t.desc.split(' — ')[0]} */` : ''}\n`;
css += '}\n';

let js = '// AUTO-GENERATED from tokens/godot.json — do not edit. Run: npm run tokens:build\n';
js += 'export const tokens = {\n';
for (const t of tokens) js += `  '${varName(t.path).slice(2)}': '${t.value}',\n`;
js += '};\n';

const dts = '// AUTO-GENERATED from tokens/godot.json — do not edit. Run: npm run tokens:build\nexport declare const tokens: Record<string, string>;\n';

if (check) {
  const ok = readFileSync(cssOut, 'utf8') === css && readFileSync(jsOut, 'utf8') === js && readFileSync(dtsOut, 'utf8') === dts;
  if (!ok) { console.error('tokens out of date — run: npm run tokens:build'); process.exit(1); }
  console.log('tokens OK');
} else {
  writeFileSync(cssOut, css);
  writeFileSync(jsOut, js);
  writeFileSync(dtsOut, dts);
  console.log(`built ${tokens.length} tokens -> tokens.css, tokens.js, tokens.d.ts`);
}
