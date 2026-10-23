import { cpSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import sirv from 'sirv';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const readerRoot = resolve(projectRoot, 'web/bluey-reader');
const mediaRoot = resolve(projectRoot, 'output/S01E01/comic-web-v4/dist/assets');
const magicMediaRoot = resolve(projectRoot, 'output/S03E10/comic-v3/dist/assets/s03e10');
const buildRoot = resolve(projectRoot, '.cache/bluey-reader/dist');

function comicReader() {
  return {
    name: 'comic-reader-local-media',
    buildStart() {
      // Fail early when this checkout lacks the local, untracked media.
      for (const episode of ['s01e01', 's03e10']) {
      const book = JSON.parse(readFileSync(resolve(readerRoot, `data/${episode}.json`), 'utf8'));
      const assets = book.pages.flatMap(page => [
        page.image,
        ...page.panels.flatMap(panel => [panel.audio, ...panel.bubbles.flatMap(bubble => [bubble.audio, ...(bubble.bubbleImage ? [bubble.bubbleImage] : [])])]),
      ]);
      for (const asset of assets) {
        const file = asset.startsWith('assets/s03e10/') ? resolve(magicMediaRoot, asset.slice('assets/s03e10/'.length)) : resolve(mediaRoot, '..', asset);
        if (!statSync(file, { throwIfNoEntry: false })?.isFile()) {
          this.error(`缺少本地漫画素材：${file}\n请恢复完整的 comic-web-v4/dist/assets 目录。`);
        }
      }
      }
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        // Keep the original HTML compatible with build.py and offline deliveries.
        return html
          .replace(/<script src="book-data\.js[^\"]*" defer><\/script>\s*/, '')
          .replace('<script src="app.js" defer></script>', '<script type="module" src="/vite-entry.js"></script>');
      },
    },
    configureServer(server) {
      // Expose only the reader's images/audio; sirv also supports audio Range requests.
      server.middlewares.use('/assets/s03e10', sirv(magicMediaRoot, { dev: true }));
      server.middlewares.use('/assets', sirv(mediaRoot, { dev: true }));
    },
    writeBundle() {
      cpSync(mediaRoot, resolve(buildRoot, 'assets'), { recursive: true });
      cpSync(magicMediaRoot, resolve(buildRoot, 'assets/s03e10'), { recursive: true });
    },
  };
}

export default defineConfig({
  root: resolve(readerRoot, 'src'),
  base: './',
  publicDir: false,
  cacheDir: resolve(projectRoot, 'node_modules/.vite'),
  plugins: [comicReader()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    fs: { allow: [readerRoot] },
  },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: {
    outDir: buildRoot,
    emptyOutDir: true,
    sourcemap: true,
  },
});
