import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages has no server-side rewrites. `public/404.html` redirects deep
 * links into the SPA, but it must know Vite's `base` at build time.
 */
function githubPagesFallback(base: string): Plugin {
  return {
    name: 'muse-github-pages-fallback',
    apply: 'build',
    async closeBundle() {
      const file = resolve(process.cwd(), 'dist/404.html');
      try {
        const html = await readFile(file, 'utf8');
        await writeFile(file, html.replaceAll('__MUSE_BASE__', base), 'utf8');
      } catch (error) {
        this.warn(
          `Could not inject the base path into 404.html: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
  };
}

/**
 * `VITE_BASE_PATH` is injected by the GitHub Actions workflow.
 * It must end with a slash: `/`, `/MUSE/`, etc.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH?.trim() || '/';

  return {
    base,
    plugins: [react(), githubPagesFallback(base)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      target: 'es2020',
      sourcemap: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            motion: ['framer-motion'],
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
