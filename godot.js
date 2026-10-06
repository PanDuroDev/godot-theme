/* godot-theme JS helpers — the three behaviors both apps reimplement: toast, dialog, search-clear. */
(function () {
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  // toast(msg, type) — type: info | success | warn | error. Needs <div id="toaster">.
  function toast(msg, type = 'info', title) {
    let box = document.getElementById('toaster');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toaster';
      document.body.appendChild(box);
    }
    const n = el(`<div class="toast-note ${type}"><span class="msg"></span><button class="t-x" aria-label="Close">✕</button></div>`);
    n.querySelector('.msg').textContent = (title ? title + '\n' : '') + msg;
    n.querySelector('.t-x').onclick = () => n.remove();
    box.appendChild(n);
    setTimeout(() => n.remove(), 5000);
    return n;
  }

  // Dialogs: <div id="x" class="dlg-back" hidden><div class="dlg" role="dialog">…
  // openDialog focuses the first control and remembers the opener;
  // closeDialog restores focus. bindDialog adds backdrop-click, Esc and Tab trap.
  const dlgOpeners = {};
  function openDialog(id) {
    const back = document.getElementById(id);
    if (!back) return;
    dlgOpeners[id] = document.activeElement;
    back.removeAttribute('hidden');
    const dlg = back.querySelector('.dlg') || back;
    const f = dlg.querySelector('button:not([disabled]), input:not([disabled]), select, [tabindex]');
    if (f && f.focus) f.focus();
  }
  function closeDialog(id) {
    const back = document.getElementById(id);
    if (back) back.setAttribute('hidden', '');
    const op = dlgOpeners[id];
    if (op && op.focus) op.focus();
    delete dlgOpeners[id];
  }
  function bindDialog(id, okId, cancelId, onOk) {
    const back = document.getElementById(id);
    if (!back) return;
    back.addEventListener('mousedown', (e) => { if (e.target === back) closeDialog(id); });
    if (cancelId) document.getElementById(cancelId)?.addEventListener('click', () => closeDialog(id));
    if (okId && onOk) document.getElementById(okId)?.addEventListener('click', onOk);
    back.addEventListener('keydown', (e) => {
      if (back.hasAttribute && back.hasAttribute('hidden')) return;
      if (e.key === 'Escape') { closeDialog(id); return; }
      if (e.key !== 'Tab') return;
      const dlg = back.querySelector('.dlg') || back;
      const q = dlg.querySelectorAll
        ? [...dlg.querySelectorAll('button:not([disabled]), input:not([disabled]), select, [tabindex]')] : [];
      const items = q.filter((elm) => !elm.disabled && elm.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  // Search field with ✕ clear button: needs .search-wrap > input + button.clear-btn
  function bindSearch(inputId, clearId, onFilter) {
    const input = document.getElementById(inputId);
    const clear = document.getElementById(clearId);
    if (!input) return;
    const update = () => {
      if (clear) clear.hidden = !input.value;
      onFilter?.(input.value);
    };
    input.addEventListener('input', update);
    clear?.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
  }

  // Popup menu (PopupMenu style). items: {label, icon, cur, sep, disabled, accel,
  //   checked (toggleable check), submenu (nested items array, arrow auto-shown)}
  // Dismisses itself on outside click / Escape. Main box uses <div id="ctxMenu"> (created if missing).
  const CHECK_SVG = '<svg viewBox="0 0 16 16" width="12" height="12"><rect width="14" height="14" x="1" y="1" fill="#699ce8" rx="2.33"/><path fill="#fff" d="M11.5 3.734 5.89 9.346 4.185 7.665l-1.5 1.499 3.204 3.18L13 5.235z"/></svg>';
  const RADIO_ON = '<svg viewBox="0 0 16 16" width="12" height="12"><circle cx="8" cy="8" r="7" fill="#699ce8"/><circle cx="8" cy="8" r="4" fill="#fff"/></svg>';
  const RADIO_OFF = '<svg viewBox="0 0 16 16" width="12" height="12"><circle cx="8" cy="8" r="7" fill="#e0e0e0" fill-opacity=".2"/></svg>';
  let menuStack = []; // [{box, cleanup, level}]
  // Submenu boxes are library-created → remove. The main #ctxMenu may be
  // app-owned → only hide it.
  function dropBox(m) {
    if (!m.box) return;
    if (m.anchor) m.anchor.setAttribute('aria-expanded', 'false');
    if (m.box.classList && m.box.classList.contains('ctxmenu')) m.box.remove();
    else m.box.hidden = true;
  }
  function closeMenu() {
    for (const m of menuStack) {
      if (m.cleanup) m.cleanup();
      dropBox(m);
    }
    menuStack = [];
  }
  function closeSubsDeeperThan(level) {
    while (menuStack.length && menuStack[menuStack.length - 1].level > level) {
      const m = menuStack.pop();
      if (m.cleanup) m.cleanup();
      dropBox(m);
    }
  }
  // chk column: radio items always show radio_on/off (OptionButton, option_button.cpp),
  // current/checkable show the check, icons live in their own column (set_item_icon pattern).
  function paintMark(btn, it) {
    const chk = btn.querySelector('.chk');
    if (it.radio) {
      if (chk) chk.innerHTML = it.cur ? RADIO_ON : RADIO_OFF;
      btn.setAttribute('aria-checked', it.cur ? 'true' : 'false');
    } else if (('checked' in it) && !it.radio) {
      if (chk) chk.innerHTML = it.checked ? CHECK_SVG : '';
      btn.setAttribute('aria-checked', it.checked ? 'true' : 'false');
    } else {
      if (chk) chk.innerHTML = it.cur ? CHECK_SVG : '';
      btn.removeAttribute('aria-checked');
    }
  }
  // Keyboard navigation (APG menu pattern): arrows/Home/End move, Enter/Space
  // activate, Right opens a submenu (Left in RTL), Left/Escape closes one level.
  let keysBound = false;
  function syncKeys() {
    if (menuStack.length && !keysBound) {
      keysBound = true;
      document.addEventListener('keydown', onMenuKey);
    } else if (!menuStack.length && keysBound) {
      keysBound = false;
      document.removeEventListener('keydown', onMenuKey);
    }
  }
  function focusEntry(entry, i) {
    const bs = entry.items;
    if (!bs.length) return;
    entry.pos = ((i % bs.length) + bs.length) % bs.length;
    bs[entry.pos].btn.focus();
  }
  function onMenuKey(e) {
    const top = menuStack[menuStack.length - 1];
    if (!top || !top.box || top.box.hidden || !top.items.length) return;
    const rtl = !!(document.documentElement && document.documentElement.dir === 'rtl');
    const bs = top.items;
    const openDir = rtl ? 'ArrowLeft' : 'ArrowRight';
    const closeDir = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === 'ArrowDown') { e.preventDefault(); focusEntry(top, top.pos < 0 ? 0 : top.pos + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusEntry(top, top.pos < 0 ? bs.length - 1 : top.pos - 1); }
    else if (e.key === 'Home') { e.preventDefault(); focusEntry(top, 0); }
    else if (e.key === 'End') { e.preventDefault(); focusEntry(top, bs.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') {
      if (top.pos >= 0 && top.pos < bs.length) { e.preventDefault(); bs[top.pos].btn.click(); }
    }
    else if (e.key === openDir) {
      const cur = top.pos >= 0 ? bs[top.pos] : null;
      if (cur && cur.it.submenu && !cur.it.disabled) openSubmenu(cur.it, cur.btn, top.onPick, top.level);
    }
    else if (e.key === 'Escape' || e.key === closeDir) {
      if (top.level > 0) {
        closeSubsDeeperThan(top.level - 1);
        const parent = menuStack[menuStack.length - 1];
        if (parent && parent.anchor && parent.anchor.focus) parent.anchor.focus();
      } else closeMenu();
    }
  }
  function buildItems(box, items, onPick, level) {
    box.innerHTML = '';
    const radioBtns = [];
    const focusable = [];
    for (const it of items || []) {
      if (it.sep) { const s = document.createElement('div'); s.className = 'msep'; s.setAttribute('role', 'separator'); box.appendChild(s); continue; }
      const b = document.createElement('button');
      if (it.cur) b.className = 'cur';
      if (it.disabled) b.disabled = true;
      b.setAttribute('role', it.submenu ? 'menuitem' : (it.radio ? 'menuitemradio' : ((('checked' in it) && !it.radio) ? 'menuitemcheckbox' : 'menuitem')));
      if (it.submenu) { b.setAttribute('aria-haspopup', 'menu'); b.setAttribute('aria-expanded', 'false'); }
      const chk = document.createElement('span'); chk.className = 'chk';
      b.appendChild(chk);
      if (it.icon) { const im = document.createElement('img'); im.src = it.icon; im.alt = ''; b.appendChild(im); }
      const sp = document.createElement('span'); sp.textContent = it.label || ''; b.appendChild(sp);
      if (it.accel) { const a = document.createElement('span'); a.className = 'acc'; a.textContent = it.accel; b.appendChild(a); }
      if (it.submenu) { const s = document.createElement('span'); s.className = 'sub'; s.textContent = '▶'; b.appendChild(s); }
      const checkable = ('checked' in it) && !it.radio;
      paintMark(b, it);
      if (!it.disabled) {
        if (it.submenu) {
          const open = () => openSubmenu(it, b, onPick, level);
          b.addEventListener('mouseenter', open);
          b.onclick = open;
        } else if (it.radio) {
          radioBtns.push([it, b]);
          b.onclick = () => {
            radioBtns.forEach(([ri, rb]) => { ri.cur = (ri === it); paintMark(rb, ri); });
            closeMenu();
            onPick?.(it);
          };
        } else if (checkable) {
          b.onclick = () => {
            it.checked = !it.checked;
            paintMark(b, it);
            onPick?.(it, { toggled: true });
          };
        } else {
          b.onclick = () => { closeMenu(); onPick?.(it); };
        }
        if (!it.submenu) b.addEventListener('mouseenter', () => closeSubsDeeperThan(level));
        focusable.push({ btn: b, it });
      }
      box.appendChild(b);
    }
    return focusable;
  }
  function placeBox(box, x, y) {
    box.hidden = false;
    const w = box.offsetWidth || 0, h = box.offsetHeight || 0;
    box.style.left = Math.max(4, Math.min(x, window.innerWidth - w - 8)) + 'px';
    box.style.top = Math.max(4, Math.min(y, window.innerHeight - h - 8)) + 'px';
  }
  function openSubmenu(it, anchorBtn, onPick, level) {
    closeSubsDeeperThan(level);
    const sub = document.createElement('div');
    sub.className = 'ctxmenu';
    sub.setAttribute('role', 'menu');
    document.body.appendChild(sub);
    const wrapped = (subItem, info) => {
      if (info && info.toggled) { onPick?.(subItem, info); return; }
      closeMenu();
      onPick?.(subItem);
    };
    const list = buildItems(sub, it.submenu, wrapped, level + 1);
    anchorBtn.setAttribute('aria-expanded', 'true');
    const r = anchorBtn.getBoundingClientRect();
    const rtl = !!(document.documentElement && document.documentElement.dir === 'rtl');
    sub.hidden = false;
    const w = sub.offsetWidth || 0, h = sub.offsetHeight || 0;
    const pb = menuStack.length ? menuStack[menuStack.length - 1].box : null;
    const pr = pb ? pb.getBoundingClientRect() : { right: r.right, left: r.left };
    const x = rtl ? pr.left - w + 2 : pr.right - 2;
    sub.style.left = Math.max(4, Math.min(x, window.innerWidth - w - 8)) + 'px';
    sub.style.top = Math.max(4, Math.min(r.top - 4, window.innerHeight - h - 8)) + 'px';
    const entry = { box: sub, cleanup: null, level: level + 1, items: list, pos: -1, onPick: wrapped, anchor: anchorBtn };
    menuStack.push(entry);
    syncKeys();
    focusEntry(entry, 0);
  }
  function menu(x, y, items, onPick) {
    closeMenu();
    if (!items || !items.length) return null;
    let box = document.getElementById('ctxMenu');
    if (!box) {
      box = document.createElement('div');
      box.id = 'ctxMenu';
      document.body.appendChild(box);
    }
    box.setAttribute('role', 'menu');
    const list = buildItems(box, items, onPick, 0);
    placeBox(box, x, y);
    const outside = (e) => {
      if (menuStack.length && !menuStack.some((m) => m.box && m.box.contains(e.target))) closeMenu();
    };
    const onScroll = () => closeMenu();
    document.addEventListener('mousedown', outside);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    const entry = { box, cleanup: () => {
      document.removeEventListener('mousedown', outside);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    }, level: 0, items: list, pos: -1, onPick, anchor: null };
    menuStack.push(entry);
    syncKeys();
    focusEntry(entry, 0);
    return box;
  }

  // Radial progress 0-100 (TextureProgressBar FILL_CLOCKWISE). Needs .radial > svg(.rk-fill) + .pct.
  const RING_C = 113.1; // 2π×18
  function ring(el, p) {
    if (!el) return;
    p = Math.max(0, Math.min(100, p));
    const fill = el.querySelector('.rk-fill');
    const pct = el.querySelector('.pct');
    if (fill) fill.style.strokeDashoffset = (RING_C * (1 - p / 100)).toFixed(1);
    if (pct) pct.textContent = Math.round(p) + '%';
  }

  // Option-button popup (launcher openOpt): menu anchored under btn.
  // items: [{v, label, ...menu fields}]. onPick(value, item).
  function optMenu(btn, items, cur, onPick) {
    const r = btn.getBoundingClientRect();
    return menu(r.left, r.bottom + 4,
      (items || []).map((o) => ({ ...o, value: o.v ?? o.label, cur: String(o.v ?? o.label) === String(cur) })),
      (it) => { if (btn.focus) btn.focus(); onPick?.(it.value, it); });
  }

  // TooltipPanel: [data-tip] targets follow the cursor. Needs <div id="tooltip"> (created if missing).
  function tips(scope) {
    let tip = document.getElementById('tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'tooltip';
      tip.hidden = true;
      document.body.appendChild(tip);
    }
    (scope || document).querySelectorAll('[data-tip]').forEach((elm) => {
      if (elm._gdTips) return;
      elm._gdTips = true;
      const move = (x, y) => {
        tip.style.left = Math.min(x + 14, window.innerWidth - 200) + 'px';
        tip.style.top = (y + 16) + 'px';
      };
      const show = (x, y) => {
        tip.textContent = elm.dataset.tip;
        move(x, y);
        tip.hidden = false;
        tip._for = elm;
        tip._shownAt = Date.now();
      };
      elm.addEventListener('mouseenter', (e) => show(e.clientX, e.clientY));
      elm.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
      elm.addEventListener('mouseleave', () => { tip.hidden = true; tip._for = null; });
      elm.addEventListener('click', (e) => {
        const x = e.clientX ?? 0, y = e.clientY ?? 0;
        if (tip._for === elm && Date.now() - (tip._shownAt || 0) > 350) { tip.hidden = true; tip._for = null; }
        else show(x, y);
      });
    });
    return tip;
  }

  const api = { toast, openDialog, closeDialog, bindDialog, bindSearch, menu, closeMenu, ring, optMenu, tips };
  window.GodotDS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
