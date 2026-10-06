// Docs-site chrome: sidebar nav, version pills, shared wiring.
// Single source of truth for release chores: bump GT_VERSION together with package.json.
const GT_VERSION = '1.2.1';

const NAV = [
  { group: 'System' },
  { href: 'index.html', label: 'Home', id: 'index' },
  { href: 'tokens.html', label: 'Tokens', id: 'tokens' },
  { href: 'icons.html', label: 'Icons', id: 'icons' },
  { href: 'fonts.html', label: 'Fonts', id: 'fonts' },
  { href: 'changelog.html', label: 'Changelog', id: 'changelog' },
  { group: 'Components' },
  { href: 'buttons.html', label: 'Buttons', id: 'buttons' },
  { href: 'rows.html', label: 'Rows', id: 'rows' },
  { href: 'forms.html', label: 'Forms', id: 'forms' },
  { href: 'dialogs.html', label: 'Dialogs', id: 'dialogs' },
  { href: 'overlays.html', label: 'Overlays', id: 'overlays' },
];

(function buildNav() {
  const side = document.querySelector('aside.docs-nav');
  if (!side) return;
  const cur = side.dataset.nav;
  side.innerHTML = '';
  for (const item of NAV) {
    if (item.group) {
      const d = document.createElement('div');
      d.className = 'side-label';
      d.textContent = item.group;
      side.appendChild(d);
      continue;
    }
    const a = document.createElement('a');
    a.className = 'side-btn' + (item.id === cur ? ' nav-active' : '');
    a.href = item.href;
    const s = document.createElement('span');
    s.textContent = item.label;
    a.appendChild(s);
    side.appendChild(a);
  }
  const grow = document.createElement('div');
  grow.className = 'grow';
  side.appendChild(grow);
})();

(function paintVersions() {
  document.querySelectorAll('.ver-pill').forEach((el) => { el.textContent = 'v' + GT_VERSION; });
})();

(function wireChrome() {
  const rtl = document.getElementById('rtlBtn');
  if (rtl) {
    rtl.onclick = () => {
      const h = document.documentElement;
      const rtlMode = h.dir !== 'rtl';
      h.dir = rtlMode ? 'rtl' : 'ltr';
      h.lang = rtlMode ? 'ar' : 'en';
    };
  }
  const ver = document.getElementById('verBtn');
  if (ver) ver.onclick = () => { location.href = 'changelog.html'; };
})();
