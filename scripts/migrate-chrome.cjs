// One-shot migration: move docs chrome (sidebar/titlebar pills/footer/about/verBtn+rtl wiring)
// into site.js. Run once with node. ASCII-safe replacements only.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pages = {
  'index.html': 'index',
  'tokens.html': 'tokens',
  'icons.html': 'icons',
  'fonts.html': 'fonts',
  'buttons.html': 'buttons',
  'rows.html': 'rows',
  'forms.html': 'forms',
  'dialogs.html': 'dialogs',
  'overlays.html': 'overlays',
  'changelog.html': 'changelog',
};

for (const [file, id] of Object.entries(pages)) {
  const p = path.join(root, file);
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  // 1. sidebar block -> placeholder
  s = s.replace(/<aside id="sidebar" class="docs-nav">[\s\S]*?<\/aside>/, `<aside id="sidebar" class="docs-nav" data-nav="${id}"></aside>`);
  // 2. titlebar pill -> filled by JS
  s = s.replace('<span class="pill ok">v1.1.0</span>', '<span class="pill ok ver-pill"></span>');
  // 3. footer verBtn -> filled by JS
  s = s.replace('<button id="verBtn">v1.1.0</button>', '<button id="verBtn" class="ver-pill"></button>');
  // 4a. drop verBtn wiring line
  s = s.replace(/\ndocument\.getElementById\('verBtn'\)\.onclick = \(\) => \{ location\.href = 'changelog\.html'; \};/, '');
  // 4b. drop rtl wiring block (CRLF-tolerant)
  s = s.replace(/ ?document\.getElementById\('rtlBtn'\)\.onclick = \(\) => \{\r?\n(?:.*\r?\n){3}.*\r?\n\};/, '');
  // 5. import site.js first in the module script (once)
  if (!s.includes("import './site.js';")) {
    s = s.replace('<script type="module">', `<script type="module">\nimport './site.js';`);
  }
  if (s === before) {
    console.log('NO-OP (check manually):', file);
  } else {
    fs.writeFileSync(p, s);
    console.log('migrated:', file);
  }
}
