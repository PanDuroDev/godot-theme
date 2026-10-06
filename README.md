# GT — Godot Theme

Standalone design-system library — Godot's dark editor theme (the Modern default in 4.6+) as vanilla CSS + tiny JS helpers, for Electron apps. Works over `file://` with zero build.

## Sources (biggest first)

| Source | Quoted value |
|---|---|
| `godotengine/godot` branch `master` — `editor/themes/editor_theme_manager.cpp` | `accent #569EFF` (`0.337,0.62,1.0`), `base #292929` (`0.161`), `corner_radius 4`, spacing sizes (`Compact 2 / Default 4 / Spacious 6`) |
| Same repo — `scene/theme/default_theme.cpp` | Font color scale (`0.875 / 0.7 / 0.65 / 0.95`) |
| Same repo — `editor/themes/editor_color_map.cpp` | Brand colors `Godot Blue #478cbf` and `Godot Gray #414042` |
| `D:\Projects\godot-launcher` (biggest quote) | All components: `btn/side-btn/prow/tag/pill/dlg/check/switch/radio/toast/tooltip/ctxMenu/dlbar/search` + icons (25 official SVGs) + Inter font |
| `D:\Projects\random-exe-lab` | Status variables `success/danger/warn` + `go` button + proof the theme works with Arabic RTL |

## Usage

Three ways, all supported and tested (`npm run test:consumer` proves the second one automatically):

```sh
npm install godot-theme               # official install from npm
npm install D:\Projects\godot-theme  # alternative: install from a local folder
```

```html
&lt;!-- 1) bundler: --&gt; import 'godot-theme'; import { tokens } from 'godot-theme/tokens.js';
&lt;!-- 2) direct link after install: --&gt;
&lt;link rel="stylesheet" href="node_modules/godot-theme/godot.css"&gt;
&lt;script src="node_modules/godot-theme/godot.js"&gt;&lt;/script&gt;
&lt;!-- 3) copy the folder next to your app (works over file:// with zero build): --&gt;
&lt;link rel="stylesheet" href="../godot-theme/godot.css"&gt;
&lt;script src="../godot-theme/godot.js"&gt;&lt;/script&gt;
```
```html
<script>
  GodotDS.toast('Generated', 'success');
  GodotDS.openDialog('dlgNew');
  GodotDS.bindSearch('search', 'searchClear');
  GodotDS.optMenu(btn, [{ v: 'edited', label: 'Last Edited', radio: true }], cur, (v) => …);
  GodotDS.tips(); // every [data-tip]
  GodotDS.menu(x, y, items, (item) => …); // + closeMenu / ring(el, 0-100)
</script>
```

Icons live in `icons/` (official Godot names: `Add, Load, Play, StatusSuccess…`), fonts in `fonts/`.

## Structure (like real libraries)

```
godot-theme/
├── tokens/godot.json      ← single source of truth (W3C DTCG + Godot ref per token)
├── tokens/tokens.css      ← generated (checked in so file:// works with no build)
├── tokens/tokens.js       ← generated (ESM)
├── scripts/build-tokens.mjs ← token generator (stdlib only, zero dependencies)
├── src/base.css           ← reset + fonts + scrollbar + focus
├── src/components/*.css   ← one file per component (button, prow, tag, form, dialog, layout, overlay)
├── godot.css / godot.js   ← the single entry point
├── icons/ (28 curated) + icons/godot/ (all 1042) + manifest ← rule-based auto-sorting
├── scripts/build-icons.mjs ← downloads everything + manifest (`--cats` checks rules locally)
├── fonts/ Inter + Vazirmatn (Arabic) + JetBrains Mono — Godot's own thirdparty files + OFL licenses
├── index.html / tokens.html / icons.html / fonts.html / buttons.html / rows.html / forms.html / dialogs.html / overlays.html + site.css ← the site (Vite)
└── docs/                  ← written docs (feeds the site later)
```

## Site (Vite)

```sh
npm install
npm run dev    # http://localhost:5173 — dev server + hot reload
npm run build  # dist/ — static site ready for any hosting
npm run serve  # serve dist/ locally on :4173
```

The library itself (`godot.css` + `godot.js` + `tokens/`) works over `file://` with no server — only the site needs Vite because it imports ESM/JSON.

## Tokens

`npm run tokens:build` generates from `tokens/godot.json`. `npm run tokens:check` for CI. Details: `docs/tokens.md`.

## Components

`docs/components.md` — class names with a markup snippet per component.

## Versions

SemVer. Log in `CHANGELOG.md`.

## Release (maintainers)

1. Bump `version` in `package.json` and `GT_VERSION` in `site.js`.
2. Add entries to `CHANGELOG.md` and `changelog.html` (move `rel-latest`).
3. Run `npm test` (smoke + coverage + tokens + package lint + consumer-pack check) and `npm run build`.
4. `npm publish --access public` (needs npm login with publish rights).

## Roadmap (later, not now)

1. Link the two apps as a dependency instead of copying files.
2. Light theme preset (the light theme in `editor_theme_manager.cpp` is ready as a reference).
3. `ponytail:` class/ID names are deliberately unprefixed for drop-in matching with both apps — prefix with `gd-` on public release if a conflict ever happens.
