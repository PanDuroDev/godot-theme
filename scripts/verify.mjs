// Coverage + integrity check: every class/id the two apps style must exist in godot-theme,
// unless explicitly allowlisted as app-specific. Run: node scripts/verify.mjs
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fail = (m) => { console.error('FAIL: ' + m); process.exitCode = 1; };
const cssFiles = ['tokens/tokens.css', 'src/base.css', ...[
  'layout', 'button', 'prow', 'tag', 'form', 'dialog', 'overlay',
].map((n) => `src/components/${n}.css`), 'src/theme-light.css', 'src/utilities.css'];

// 1. godot.css imports resolve
const entry = readFileSync(join(root, 'godot.css'), 'utf8');
for (const m of entry.matchAll(/@import url\('([^']+)'\)/g)) {
  if (!existsSync(join(root, m[1]))) fail(`godot.css imports missing file ${m[1]}`);
}

// 2. every shipped css file is imported by godot.css
for (const f of cssFiles) {
  if (!entry.includes(f)) fail(`${f} not imported by godot.css`);
  if (!existsSync(join(root, f))) fail(`missing ${f}`);
}

// App-specific (NOT library): owner + reason. Everything else must be covered.
const ALLOW = new Map([
  // godot-launcher — Views (écrans, not components)
  ['#loading', 'launcher: transient loading label inside filterbar'],
  ['#emptyBox', 'launcher: empty-state view id (styled by lib .empty)'],
  ['.empty-actions', 'lib component (layout.css)'],
  ['.empty-note', 'lib component (layout.css)'],
  ['#versionsView', 'launcher: versions tab view'],
  ['#installedList', 'launcher: versions tab view'],
  ['#availList', 'launcher: versions tab view'],
  ['.vgroup', 'launcher: versions tab view'],
  ['.ver-toolbar', 'launcher: versions tab view'],
  ['.ver-search', 'launcher: versions tab view'],
  ['.vico', 'launcher: versions tab view (unstable tint)'],
  ['#instCount', 'launcher: versions tab view'],
  ['#availCount', 'launcher: versions tab view'],
  ['#relStatus', 'launcher: versions tab view'],
  ['#npRendInfo', 'launcher: new-project renderer description text'],
  ['#cfText', 'launcher: confirm dialog body text'],
  ['#settingsBtn', 'launcher: titlebar settings button id (styled by .flat)'],
  ['#npName', 'launcher: dialog field id (styled by .dlg input)'],
  ['#npPath', 'launcher: dialog field id (styled by .dlg input)'],
  ['#ipPath', 'launcher: dialog field id (styled by .dlg input)'],
  ['.unstable', 'launcher: versions tab view (unstable tint)'],
  ['#openRow', 'launcher: sidebar Edit+arrow composite'],
  ['.arrow', 'launcher: sidebar Edit+arrow composite'],
  ['#engineBind', 'launcher: sidebar engine picker binding'],
  ['#btnDonate', 'launcher: sidebar donate button id (styled by .side-btn)'],
  // random-exe-lab — app views
  ['.logo', 'lab: titlebar brand mark'],
  ['.tb-title', 'lab: titlebar brand text'],
  ['#pvStrip', 'lab: preview strip view'],
  ['#pvTitle', 'lab: preview strip view'],
  ['#pvOut', 'lab: preview strip view'],
  ['.pvbar', 'lab: preview strip view'],
  ['#pvBase', 'lab: preview strip view'],
  ['#pvRand', 'lab: preview strip view'],
  ['#pvParts', 'lab: preview strip view'],
  ['#loader', 'lab: fullscreen loader overlay (uses lib .spin)'],
  ['.off', 'lab: loader hidden state'],
  ['.you', 'lab: chat message variant'],
  ['.ai', 'lab: chat message variant'],
  ['#chat', 'lab: chat drawer view'],
  ['.chead', 'lab: chat drawer view'],
  ['#hist', 'lab: chat drawer view'],
  ['.crow', 'lab: chat drawer view'],
  ['#explainBtn', 'lab: chat drawer view'],
  ['#apps', 'lab: list container id (styled like #projectList)'],
  ['#projectList', 'launcher: list container id'],
  ['#info', 'lab: sidebar info line'],
  ['#ratioBar', 'lab: sidebar ratio bar fill (uses lib .dlbar track)'],
  ['.hidden', 'lab: generic hide helper (lib uses [hidden])'],
]);

// Consumer apps are optional: present on the author's machine, absent in CI
// and on other machines. Coverage is enforced wherever they exist.
const APPS = [
  'D:\\Projects\\godot-launcher\\styles.css',
  'D:\\Projects\\random-exe-lab\\electron\\ui\\styles.css',
].filter((f) => {
  if (!existsSync(f)) { console.warn(`verify: skipping missing app file ${f}`); return false; }
  return true;
});
const selRe = /([.#])([A-Za-z][\w-]*)/g;
function selectorsOf(file) {
  const out = new Set();
  const css = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/#[0-9a-fA-F]{3,8}\b/g, ''); // strip hex colors so they are not read as ids
  for (const m of css.matchAll(selRe)) out.add(m[1] + m[2]);
  return out;
}
const lib = new Set();
for (const f of cssFiles) for (const s of selectorsOf(join(root, f))) lib.add(s);

let missing = [];
for (const app of APPS) {
  for (const s of selectorsOf(app)) {
    if (!lib.has(s) && !ALLOW.has(s) && !missing.includes(`${s} (${app})`)) missing.push(`${s} (${app})`);
  }
}
if (missing.length) fail('selectors not in library:\n  ' + missing.join('\n  '));
if (!process.exitCode) {
  console.log(APPS.length
    ? `verify OK — ${lib.size} selectors cover both apps (${ALLOW.size} app-specific allowlisted)`
    : `verify OK — internal integrity only (${lib.size} selectors, no consumer apps present)`);
}
