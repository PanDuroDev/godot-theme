// Smoke test for godot.js with a tiny DOM stub (node stdlib only). Run: node scripts/smoke.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const assert = (cond, msg) => { if (!cond) { failures++; console.error('FAIL: ' + msg); } };

function makeEl(tag = 'div') {
  const el = {
    tag, children: [], listeners: {}, textContent: '', hidden: false, value: '',
    style: {}, offsetWidth: 200, offsetHeight: 120,
    _class: '', id: '',
    get className() { return this._class; },
    set className(v) { this._class = v; },
    set innerHTML(v) { this._innerHTML = v; },
    get innerHTML() { return this._innerHTML || ''; },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; },
    removeAttribute(k) { delete this[k]; },
    hasAttribute(k) { return k in this && this[k] !== undefined; },
    appendChild(c) { c._parent = this; this.children.push(c); return c; },
    remove() { this.removed = true; const p = this._parent; if (p) { const i = p.children.indexOf(this); if (i >= 0) p.children.splice(i, 1); } },
    focus() { this.focused = true; },
    click() { this.fire('click'); },
    querySelectorAll() { return []; },
    addEventListener(t, fn) { (this.listeners[t] ||= []).push(fn); },
    fire(t, e = {}) { (this.listeners[t] || []).forEach((fn) => fn({ target: this, ...e })); if (typeof this['on' + t] === 'function') this['on' + t]({ target: this, ...e }); },
    contains(other) { return this.children.includes(other); },
    get classList() { const self = this; return { contains: (c) => (self._class || '').split(/\s+/).includes(c) }; },
    getBoundingClientRect() { return { left: 0, top: 0, right: 200, bottom: 24, width: 200, height: 24 }; },
    querySelector(sel) {
      for (const part of String(sel).split(',')) {
        const cls = part.trim().replace('.', '');
        if (this.stubs?.[cls]) return this.stubs[cls];
      }
      return null;
    },
  };
  return el;
}

const byId = {};
global.document = {
  body: makeEl('body'),
  documentElement: { dir: 'ltr' },
  createElement: (t) => makeEl(t),
  getElementById: (id) => byId[id] || null,
  querySelectorAll: () => [],
  addEventListener: (t, fn) => { ((global.document._l ||= {})[t] ||= []).push(fn); },
  removeEventListener: (t, fn) => { const a = (global.document._l || {})[t] || []; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); },
};
global.window = { innerWidth: 1280, innerHeight: 800,
  addEventListener: (t, fn) => { ((global.window._l ||= {})[t] ||= []).push(fn); },
  removeEventListener: (t, fn) => { const a = (global.window._l || {})[t] || []; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); },
};
const timers = [];
global.setTimeout = (fn, ms) => { timers.push({ fn, ms }); return 0; };

// Load godot.js (it guards module.exports)
const src = readFileSync(join(root, 'godot.js'), 'utf8');
const module = { exports: {} };
new Function('module', 'window', 'document', 'setTimeout', src)(module, global.window, global.document, global.setTimeout);
const G = global.window.GodotDS;
assert(G && typeof G.toast === 'function', 'GodotDS.toast exported');

// toast() creates node with type class + text, ✕ removes it
const box = makeEl('div'); box.id = 'toaster'; byId.toaster = box;
const msgStub = makeEl('span'), xStub = makeEl('button');
const origCreate = global.document.createElement;
global.document.createElement = (t) => {
  if (t === 'template') return { _v: '', set innerHTML(v) { this._v = v; }, get content() { const self = this; return { get firstChild() { const n = makeEl('div'); n._innerHTML = self._v || ''; const m = /class="([^"]*)"/.exec(self._v || ''); if (m) n.className = m[1]; n.stubs = { msg: msgStub, 't-x': xStub }; return n; } }; } };
  return origCreate(t);
};
const n = G.toast('hello', 'success', 'Done');
assert(n.className.includes('toast-note') && n.className.includes('success'), 'toast has type class');
assert(msgStub.textContent.includes('hello') && msgStub.textContent.includes('Done'), 'toast text set');
assert(box.children.length === 1, 'toast appended to #toaster');
xStub.fire('click');
assert(n.removed === true, 'toast ✕ removes node');
// toast icons, unknown-type fallback, stacking cap, custom duration
const iconToast = G.toast('with icon', 'warn');
assert(iconToast.innerHTML.includes('t-ico') && iconToast.innerHTML.includes('<svg'), 'toast renders type icon');
const fallbackToast = G.toast('fallback', 'nope');
assert(fallbackToast.className.includes('toast-note info'), 'unknown type falls back to info');
for (let i = 0; i < 7; i++) G.toast('spam ' + i, 'info');
assert(box.children.length === 5, 'toast stack capped at 5');
G.toast('slow', 'info', null, 9000);
assert(timers[timers.length - 1].ms === 9000, 'toast honors custom duration');

// dialog open/close + backdrop click
const dlg = makeEl('div'); byId.dlgDemo = dlg;
dlg.setAttribute('hidden', '');
G.openDialog('dlgDemo');
assert(!dlg.hasAttribute('hidden'), 'openDialog removes hidden');
const okBtn = makeEl('button'), cancelBtn = makeEl('button');
byId.okBtn = okBtn; byId.cancelBtn = cancelBtn;
let okFired = false;
G.bindDialog('dlgDemo', 'okBtn', 'cancelBtn', () => { okFired = true; });
okBtn.fire('click');
assert(okFired, 'dialog onOk fires');
cancelBtn.fire('click');
assert(dlg.getAttribute('hidden') === '', 'cancel closes dialog');

// search clear binding
const input = makeEl('input'), clear = makeEl('button');
input.value = 'x'; clear.hidden = true;
byId.search = input; byId.searchClear = clear;
let filtered = null;
G.bindSearch('search', 'searchClear', (v) => { filtered = v; });
input.fire('input');
assert(clear.hidden === false && filtered === 'x', 'typing shows clear + filters');
clear.fire('click');
assert(input.value === '' && filtered === '', 'clear resets');

// menu(): builds items, picks, dismisses
const picked = [];
const mb = G.menu(100, 100, [
  { label: 'Open', cur: true, accel: 'Ctrl+O' },
  { sep: true },
  { label: 'Gone', disabled: true },
], (it) => picked.push(it.label));
assert(mb && mb.hidden === false, 'menu opens');
assert(mb.children.length === 3, 'menu has item + separator + disabled');
assert(mb.children[2].disabled === true, 'disabled item disabled');
mb.children[0].fire('click');
assert(picked[0] === 'Open' && mb.hidden === true, 'pick fires + menu closes');
G.menu(10, 10, [{ label: 'X' }], () => {});
G.closeMenu();

// checkable item toggles, menu stays open
let lastToggle = null;
const mc = G.menu(0, 0, [{ label: 'Hidden', checked: false }], (it, info) => { lastToggle = { checked: it.checked, info }; });
const chkBtn = mc.children[0];
chkBtn.fire('click');
assert(mc.hidden === false && lastToggle.checked === true, 'check toggles on, menu stays open');
chkBtn.fire('click');
assert(lastToggle.checked === false, 'check toggles off');

// radio group: select moves, menu closes, marks repaint
let radioPick = null;
const radioItems = [
  { label: 'A', radio: true },
  { label: 'B', radio: true, cur: true },
];
const mr = G.menu(0, 0, radioItems, (it) => { radioPick = it.label; });
const rBtns = mr.children;
rBtns[0].fire('click');
assert(radioPick === 'A' && mr.hidden === true, 'radio pick fires + closes');
assert(radioItems[0].cur === true && radioItems[1].cur === false, 'radio selection moves');

// submenu opens a second panel
const ms = G.menu(0, 0, [{ label: 'More', submenu: [{ label: 'Deep' }] }], () => {});
const moreBtn = ms.children[0];
moreBtn.fire('mouseenter');
const sub = global.document.body.children.find((c) => c.className && c.className.includes('ctxmenu'));
assert(sub && sub.hidden === false, 'submenu opens second panel');
assert(sub.children.length === 1, 'submenu has its item');
G.closeMenu();
assert(ms.hidden === true && ms.removed !== true, 'main box hidden, not removed');
assert(sub.removed === true, 'submenu box removed from DOM on close');

// empty menu refuses to open
assert(G.menu(0, 0, [], () => {}) === null, 'empty menu returns null');

// scroll / resize dismisses open menus
const mq = G.menu(0, 0, [{ label: 'Q' }], () => {});
assert(mq.hidden === false, 'menu opens for scroll test');
(global.window._l.scroll || []).forEach((fn) => fn({}));
assert(mq.hidden === true, 'scroll closes menu');
const mq2 = G.menu(0, 0, [{ label: 'Q' }], () => {});
(global.window._l.resize || []).forEach((fn) => fn({}));
assert(mq2.hidden === true, 'resize closes menu');

// menu keyboard (APG): focus, arrows (skip disabled), Enter, Escape levels
const kbItems = [{ label: 'One' }, { label: 'Two', disabled: true }, { label: 'Three' }];
let kbPick = null;
const kb = G.menu(0, 0, kbItems, (it) => { kbPick = it.label; });
const kbBtns = kb.children.filter((c) => c.tag === 'button');
const key = (k, extra = {}) => (global.document._l.keydown || []).forEach((fn) => fn({ key: k, preventDefault() {}, ...extra }));
assert(kbBtns[0].focused === true, 'menu open focuses first item');
key('ArrowDown');
assert(kbBtns[2].focused === true, 'ArrowDown skips disabled item');
key('ArrowDown');
assert(kbBtns[0].focused === true, 'ArrowDown wraps around');
key('ArrowUp');
assert(kbBtns[2].focused === true, 'ArrowUp wraps to last');
key('Enter');
assert(kbPick === 'Three' && kb.hidden === true, 'Enter activates focused item');
// submenu via keyboard, Escape closes one level with focus back
const kb2Items = [{ label: 'Solo' }, { label: 'More', submenu: [{ label: 'Deep' }] }];
const kb2 = G.menu(0, 0, kb2Items, () => {});
const kb2Btns = kb2.children.filter((c) => c.tag === 'button');
key('ArrowDown'); // focus More
assert(kb2Btns[1].focused === true, 'focus on submenu parent');
key('Enter'); // opens submenu (does not pick)
const ksub = global.document.body.children.find((c) => c.className && c.className.includes('ctxmenu'));
assert(ksub && ksub.hidden === false, 'Enter opens submenu');
assert(ksub.children[0].focused === true, 'submenu focuses its first item');
key('Escape');
assert(ksub.removed === true && kb2.hidden === false, 'Escape closes submenu level only');
assert(kb2Btns[1].focused === true, 'focus returns to submenu parent');
key('Escape');
assert(kb2.hidden === true, 'Escape closes top menu');
// dialog focus in + restore + Esc + Tab trap
const opener = makeEl('button');
global.document.activeElement = opener;
const fbtn1 = makeEl('button'), fbtn2 = makeEl('button');
const innerDlg = makeEl('div');
innerDlg.querySelectorAll = () => [fbtn1, fbtn2];
innerDlg.stubs = { 'button:not([disabled])': fbtn1 };
const backEl = makeEl('div');
backEl.stubs = { dlg: innerDlg };
byId.dlgFocus = backEl;
G.bindDialog('dlgFocus', null, null, null);
G.openDialog('dlgFocus');
assert(fbtn1.focused === true, 'openDialog focuses first control');
const fireDlgKey = (e) => (backEl.listeners.keydown || []).forEach((fn) => fn(e));
global.document.activeElement = fbtn2;
fireDlgKey({ key: 'Tab', shiftKey: false, preventDefault() { this.pd = true; } });
assert(fbtn1.focused === true, 'Tab wraps to first control');
global.document.activeElement = fbtn1;
const shev = { key: 'Tab', shiftKey: true, preventDefault() { this.pd = true; } };
fireDlgKey(shev);
assert(fbtn2.focused === true && shev.pd === true, 'Shift+Tab wraps to last control');
fireDlgKey({ key: 'Escape' });
assert(backEl.getAttribute('hidden') === '' , 'Escape closes dialog');
G.openDialog('dlgFocus');
G.closeDialog('dlgFocus');
assert(opener.focused === true, 'closeDialog restores opener focus');
delete global.document.activeElement;
// tips click toggle (touch)
const obtn = makeEl('button');
let optVal = null;
const om = G.optMenu(obtn, [
  { v: 'KB', label: 'KB', radio: true },
  { v: 'MB', label: 'MB', radio: true },
], 'KB', (v) => { optVal = v; });
om.children[1].fire('click');
assert(optVal === 'MB' && om.hidden === true, 'optMenu picks value + closes');

// tips(): reuses #tooltip, binds nothing twice
const tipBox = makeEl('div'); tipBox.id = 'tooltip'; byId.tooltip = tipBox;
const t = G.tips();
assert(t === tipBox, 'tips reuses #tooltip');
// tips click toggle (touch): tap shows, second tap hides
const tipElm = makeEl('button'); tipElm.dataset = { tip: 'hello tip' };
const origQSA = global.document.querySelectorAll;
global.document.querySelectorAll = (sel) => (sel === '[data-tip]' ? [tipElm] : []);
G.tips();
tipElm.fire('click', { clientX: 10, clientY: 10 });
assert(byId.tooltip.textContent === 'hello tip' && byId.tooltip.hidden === false, 'tips click shows (touch)');
byId.tooltip._shownAt = Date.now() - 1000; // simulate time passing
tipElm.fire('click', { clientX: 10, clientY: 10 });
assert(byId.tooltip.hidden === true, 'tips second click hides');
global.document.querySelectorAll = origQSA;
const fillStub = { style: {} };
const pctStub = { textContent: '' };
const rel = makeEl('span');
rel.stubs = { 'rk-fill': fillStub, pct: pctStub };
G.ring(rel, 50);
assert(fillStub.style.strokeDashoffset === '56.5', 'ring offset at 50%');
assert(pctStub.textContent === '50%', 'ring label at 50%');
G.ring(rel, 150);
assert(pctStub.textContent === '100%', 'ring clamps to 100%');

if (failures) process.exit(1);
console.log('smoke OK — toast, dialog, search, menu, ring, optMenu, tips');
