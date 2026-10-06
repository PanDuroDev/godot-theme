# Components — GT 1.0.0

ملف CSS لكل مكون في `src/components/`. المكتبة تملك هذه الـ IDs لأن التطبيقين يستخدمانها حرفيًا: `#root #titlebar #viewToggles #mainPanel #filterbar #content #listPanel #sidebar #statusbar #toaster #ctxMenu #tooltip`.

## button.css

```html
<button class="btn"><img src="icons/Add.svg"><span>New</span></button>
<button class="btn small opt"><span>Sort</span><span class="chev">▾</span></button>
<button class="btn go"><span>Generate</span></button>   <!-- lab: primary action -->
<button class="btn danger"><span>Delete</span></button> <!-- lab: destructive -->
<button class="btn accent"><span>OK</span></button>
<button class="side-btn primary"><img src="icons/Edit.svg"><span>Edit</span></button>
<button class="flat">Settings</button>
<button class="view-toggle active">Projects</button>    <!-- MainScreenButton: active = accent, no bg -->
<button class="linklike">More information</button>
```

## prow.css — صف مشروع/تطبيق (ProjectListItemControl)

```html
<div class="prow selected">
  <button class="fav on"><img src="icons/Favorites.svg"></button>
  <div class="picon"><img src="icon.svg"></div>
  <div class="pmain">
    <div class="ptitle-row"><span class="ptitle">Name</span><span class="tags">…</span></div>
    <div class="ppath-row"><button class="explore">…</button><span class="ppath">C:\…</span></div>
    <div class="pmeta"><span>2026-10-05 01:00</span></div>
  </div>
  <div class="vbtns">…</div>
</div>
```

## tag.css

`.tag` (+`.ver-tag` أخضر للإصدارات، `.ok`)، `.pill` (+`.beta` +`.ok`)، `.dot` (+`.ok` +`.err`)، `.chip` داخل `.chips`.

## form.css

`.search-wrap > input + .clear-btn + .search-icon` (اربطها بـ `GodotDS.bindSearch`)، `.sort-label`، `.radio-col`، ومدخلات `#sidebar`.

```html
&lt;label class="check"&gt;&lt;input type="checkbox" checked&gt;&lt;span class="box"&gt;&lt;svg class="ok" …/&gt;&lt;svg class="er" …/&gt;&lt;/span&gt; Edit Now&lt;/label&gt;
&lt;label class="check error"&gt;…&lt;/label&gt;  &lt;!-- required + invalid → red X, no emoji anywhere --&gt;
&lt;input type="range" class="slider"&gt;  &lt;!-- HSlider: thin track + white-dot grabber (GuiSliderGrabber/Hl) --&gt;
&lt;label class="switch"&gt;&lt;input type="checkbox"&gt;&lt;span class="trk"&gt;&lt;span class="knob"&gt;&lt;/span&gt;&lt;/span&gt;&lt;/label&gt;
```

## layout.css — shell + empty state

```html
&lt;div class="empty"&gt;
  &lt;p&gt;&lt;b&gt;No rows match.&lt;/b&gt; Try a different filter.&lt;/p&gt;
  &lt;div class="empty-actions"&gt;&lt;button class="btn"&gt;…&lt;/button&gt;&lt;/div&gt;
  &lt;p class="empty-note"&gt;…&lt;/p&gt;
&lt;/div&gt;
```

## dialog.css — ConfirmationDialog / ProjectDialog / EditorFileDialog

```html
<div id="dlgX" class="dlg-back" hidden>
  <div class="dlg wide? about?" role="dialog" aria-modal="true">
    <h3>…</h3>
    <div class="row spread?">…</div>
    <div class="dlg-msg ok? err?"></div>
    <div class="dlg-actions center? left?">…</div>
  </div>
</div>
```
اربطها بـ `GodotDS.bindDialog(id, okId, cancelId, onOk)`. الفتح يركّز أول كنترول ويعيد التركيز للفاتح عند الإغلاق؛ `Esc` يغلق و`Tab` محبوس داخل النافذة. قوائم الملفات: `.fdlist > .fdrow(.sel) > .meta`.

## overlay.css — EditorToaster / menu / tooltip / progress

`#toaster > .toast-note.info|success|warn|error > .msg + .t-x` (عبر `GodotDS.toast(msg, type, title)`)، `#tooltip` (أهداف `data-tip`)، `.dlbar > i` (`style.width`)، `.spin` (غير محدد).

```html
&lt;span class="radial"&gt;&lt;svg …&gt;&lt;circle class="rk-track" …/&gt;&lt;circle class="rk-fill" …/&gt;&lt;/svg&gt;&lt;span class="pct"&gt;0%&lt;/span&gt;&lt;/span&gt;
GodotDS.ring(el, 65);  // TextureProgressBar clockwise من الأعلى
```

```js
// PopupMenu حقيقية — تُغلق نفسها بالضغط خارجها / Escape (theme_modern.cpp: radius 0,
// hover من base، فاصل mono×0.075، .cur للعنصر الحالي، .acc للاختصار، .sub لسهم submenu)
GodotDS.menu(x, y, [
  { label: 'Open', icon: 'icons/Play.svg', accel: 'Ctrl+O' },
  { label: 'Show hidden', checked: true }, // زر صح يتبدل والقائمة تبقى مفتوحة
  { sep: true },
  { label: 'More…', submenu: [             // قائمة ثانية حقيقية (.ctxmenu)
    { label: 'Option A', checked: false },
    { label: 'Option B' },
  ] },
  { label: 'Remove', disabled: true },
], (item, info) => …);
GodotDS.closeMenu();
```
// Submenu panels are removed from the DOM on close; open menus also dismiss on scroll/resize.

```js
// Option-button popup (launcher openOpt): anchored under the button.
GodotDS.optMenu(btn, [
  { v: 'edited', label: 'Last Edited', radio: true },
  { v: '4.5-stable', label: '4.5-stable', icon: 'icons/Godot.svg', radio: true },
], currentValue, (value, item) => …);

// TooltipPanel for every [data-tip] target.
GodotDS.tips(); // or GodotDS.tips(scopeEl) — also toggles on tap for touch.
```
// Keyboard (APG menu pattern): arrows/Home/End move, Enter/Space activate, Right/Left opens/closes submenus (mirrored in RTL), Esc closes one level. `optMenu` returns focus to its button. Menus carry `menu/menuitem*` roles; dialogs need `role="dialog"` (above).

حقول العنصر: `label`، `icon` (عمود أيقونة دائم — `set_item_icon`)، `cur` (أبيض + صح، نمط `openOpt` في اللانشر)، `checked` (صح تتبدل)، `radio` (راديو دائم الظهور للمحدد وغيره — `OptionButton`، ويُستخدم مع `cur` للمحدد)، `accel`، `sep`، `submenu`، `disabled`.
