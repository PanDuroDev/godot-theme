# Tokens — GT 1.0.0

المصدر: `tokens/godot.json`. التوليد: `npm run tokens:build`. كل توكن يحمل مرجعه من سورس Godot في حقل `$description`.

## Color

| Token | Value | Godot ref |
|---|---|---|
| `--bg` | `#141414` | `window_complex` (theme_modern.cpp) |
| `--panel` | `#292929` | `base_color 0.161` — Modern default (editor_theme_manager.cpp) |
| `--panel-dark` | `#1c1c1c` | base darkened — inputs/file lists |
| `--list-bg` | `#1f1f1f` | project list surface |
| `--popup` | `#121212` | menus/tooltips |
| `--btn` / `--btn-hover` / `--btn-pressed` / `--btn-border` | `#424242` / `#4d4d4d` / `#505050` / `#484848` | Button stylebox family |
| `--accent` | `#569eff` | `accent_color 0.337,0.62,1.0` — Modern default |
| `--accent-hover` | `#77b0ff` | accent lightened |
| `--success` | `#73f280` | StatusSuccess family (lab) |
| `--danger` | `#ff786b` | StatusError family (lab) |
| `--warn` | `#d4c79e` | StatusWarning family (lab) |
| `--text` / `--muted` / `--faint` | `rgba(255,255,255,.75/.55/.35)` | control_font scale (default_theme.cpp) |
| `--sep` | `rgba(0,0,0,.45)` | separators |
| `--sel` / `--sel-hover` / `--row-hover` | `#353535` / `#383838` / `#2c2c2c` | selection family |
| `--brand-blue` / `--brand-gray` | `#478cbf` / `#414042` | Godot brand (editor_color_map.cpp) |
| `--scroll-thumb` / `--scroll-thumb-hover` | `rgba(255,255,255,.225/.5)` | scrollbar |
| `--selection` | `rgba(86,158,255,.4)` | text selection |

## Shape / type / space

| Token | Value | Godot ref |
|---|---|---|
| `--radius` | `4px` | Modern `corner_radius` (Classic كان 3) |
| `--font` | `Inter,Vazirmatn,…` | Inter IS Godot's font; Vazirmatn = Arabic fallback (editor_fonts.cpp, base 14px) |
| `--font-mono` | `JetBrains Mono,…` | Godot's code font (editor_fonts.cpp) |
| `--font-size` / `--title-size` / `--small-size` / `--tiny-size` | `14/15/12/11px` | title = base+1 bold (project_list.cpp) |
| `--gap` | `4px` | Default spacing preset (Compact 2, Spacious 6) |
| `--titlebar-h` | `44px` | title bar (project_manager.cpp) |
| `--row-icon` / `--row-icon-sm` | `64px` / `40px` | ProjectListItemControl 64 |
| `--sidebar-w` | `160px` | sidebar (project_manager.cpp) |

## Theming

All color tokens can be overridden for the Light preset (Godot's `Light` color preset in `editor_theme_manager.cpp`) without touching components:

```html
&lt;html data-theme="light"&gt;
```

`src/theme-light.css` holds every override (surfaces, text, buttons, hovers, status colors). Non-color tokens (radius, fonts, spacing) are shared. The project tile (`.picon`) intentionally stays dark on both themes.
