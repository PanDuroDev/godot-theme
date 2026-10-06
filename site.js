// Docs-site chrome: sidebar nav, version pills, shared wiring.
// Single source of truth for release chores: bump GT_VERSION together with package.json.
const GT_VERSION = '1.4.0';

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
  { href: 'utilities.html', label: 'Utilities', id: 'utilities' },
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
  const bar = document.getElementById('titlebar');
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
  if (bar && rtl && !document.getElementById('themeBtn')) {
    const tb = document.createElement('button');
    tb.id = 'themeBtn';
    tb.className = 'flat';
    tb.title = 'Toggle light / dark theme';
    const paintTheme = () => {
      const light = document.documentElement.dataset.theme === 'light';
      tb.innerHTML = light ? '<span>Dark</span>' : '<span>Light</span>';
    };
    tb.onclick = () => {
      const root = document.documentElement;
      const light = root.dataset.theme !== 'light';
      if (light) root.dataset.theme = 'light';
      else delete root.dataset.theme;
      try { localStorage.setItem('gt-theme', light ? 'light' : 'dark'); } catch (_) {}
      paintTheme();
    };
    try {
      if (localStorage.getItem('gt-theme') === 'light') document.documentElement.dataset.theme = 'light';
    } catch (_) {}
    paintTheme();
    bar.insertBefore(tb, rtl);
  }
  if (bar && rtl && !document.getElementById('searchBtn')) {
    const sb = document.createElement('button');
    sb.id = 'searchBtn';
    sb.className = 'flat';
    sb.title = 'Search docs (/)';
    sb.innerHTML = '<img src="icons/Search.svg" width="16" height="16" alt=""><span>Search</span>';
    sb.onclick = () => openSearch(sb.getBoundingClientRect());
    bar.insertBefore(sb, rtl);
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      openSearch(sb.getBoundingClientRect());
    });
  }
})();

// Site search palette: filters a tiny index, shows matches in a GodotDS menu.
const SEARCH_INDEX = [
  { t: 'Home', s: 'install download npm usage', href: 'index.html' },
  { t: 'Tokens', s: 'colors type spacing copy', href: 'tokens.html' },
  { t: 'Icons', s: '1042 svg download copy', href: 'icons.html' },
  { t: 'Fonts', s: 'Inter Vazirmatn mono download', href: 'fonts.html' },
  { t: 'Changelog', s: 'releases versions', href: 'changelog.html' },
  { t: 'Buttons', s: 'btn side-btn flat toggle opt sort engine', href: 'buttons.html' },
  { t: 'Rows', s: 'project list prow tags pills search filter empty', href: 'rows.html' },
  { t: 'Forms', s: 'input check switch radio slider search validate', href: 'forms.html' },
  { t: 'Dialogs', s: 'new project file browser about confirm', href: 'dialogs.html' },
  { t: 'Overlays', s: 'toast menu tooltip progress ring submenu', href: 'overlays.html' },
  { t: 'Utilities', s: 'spacing text background flex gap margin padding', href: 'utilities.html' },
];
function openSearch(anchor) {
  let q = '';
  const cleanup = () => document.removeEventListener('keydown', onKey);
  const build = () => {
    const items = SEARCH_INDEX
      .filter((e) => (e.t + ' ' + e.s).toLowerCase().includes(q.trim().toLowerCase()))
      .map((e) => ({ label: e.t }));
    if (!items.length) items.push({ label: 'No matches', disabled: true });
    GodotDS.menu(anchor.left, anchor.bottom + 4, items, (it) => {
      const hit = SEARCH_INDEX.find((e) => e.t === it.label);
      cleanup();
      if (hit) location.href = hit.href;
    });
  };
  const onKey = (e) => {
    if (!document.querySelector('#ctxMenu:not([hidden])')) { cleanup(); return; }
    if (e.key === 'Escape') return; // the menu itself closes; we clean up right after
    if (e.key === 'Backspace') { e.preventDefault(); q = q.slice(0, -1); build(); }
    else if (e.key.length === 1) { q += e.key; build(); }
  };
  document.addEventListener('keydown', onKey);
  build();
}
