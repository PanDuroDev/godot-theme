import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

// Multi-page docs site. Build -> dist/ (static hosting) + packed tgz for the download button.
export default defineConfig({
  base: './',
  define: {
    __GODOT_DS_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        tokens: 'tokens.html',
        icons: 'icons.html',
        fonts: 'fonts.html',
        changelog: 'changelog.html',
        buttons: 'buttons.html',
        rows: 'rows.html',
        forms: 'forms.html',
        dialogs: 'dialogs.html',
        overlays: 'overlays.html',
      },
    },
  },
});
